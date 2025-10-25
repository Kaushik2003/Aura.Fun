#!/usr/bin/env node

/**
 * AuraFi Oracle Script
 * Computes creator aura from Farcaster metrics and updates vault contracts
 */

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Constants matching contract parameters
const A_MIN = 0;
const A_MAX = 200;
const A_REF = 100;

// Weights for aura computation
const WEIGHTS = {
    followers: 0.35,
    followerDelta: 0.25,
    avgLikes: 0.30,
    verification: 0.10
};

// Normalization parameters (log-based scaling)
const NORM_PARAMS = {
    followers: { min: 10, max: 100000, scale: 200 },
    followerDelta: { min: -100, max: 1000, scale: 200 },
    avgLikes: { min: 1, max: 1000, scale: 200 }
};

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Log-based normalization to map counts to 0-200 range
 */
function normalizeLog(value, min, max, scale) {
    if (value <= min) return 0;
    if (value >= max) return scale;

    // Log-based interpolation
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    const logValue = Math.log(value);

    const normalized = ((logValue - logMin) / (logMax - logMin)) * scale;
    return clamp(normalized, 0, scale);
}

/**
 * Resolve Farcaster username to FID
 * @param {string} username - Farcaster username (without @)
 * @param {boolean} mockMode - Use mock data for testing
 * @returns {string} Farcaster ID
 */
async function resolveFarcasterUsername(username, mockMode = false) {
    if (mockMode) {
        console.log('🧪 Mock mode: Using hardcoded FID for username');
        return '12345'; // Mock FID
    }

    try {
        const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

        if (!NEYNAR_API_KEY) {
            console.warn('⚠️  NEYNAR_API_KEY not set, using mock data');
            return resolveFarcasterUsername(username, true);
        }

        // Fetch user by username (v2 endpoint)
        const response = await axios.get(
            `https://api.neynar.com/v2/farcaster/user/by_username?username=${username}`,
            {
                headers: { 'api_key': NEYNAR_API_KEY }
            }
        );

        const user = response.data.user;

        if (!user) {
            throw new Error(`Username @${username} not found`);
        }

        console.log(`✅ Resolved @${username} → FID ${user.fid}`);
        return user.fid.toString();

    } catch (error) {
        console.error('❌ Error resolving username:', error.message);
        if (error.response?.status === 404) {
            throw new Error(`Username @${username} not found on Farcaster`);
        }
        console.log('Falling back to mock mode');
        return resolveFarcasterUsername(username, true);
    }
}

/**
 * Fetch Farcaster metrics for a creator
 * @param {string} creatorFid - Farcaster ID
 * @param {boolean} mockMode - Use mock data for testing
 */
async function fetchFarcasterMetrics(creatorFid, mockMode = false) {
    if (mockMode) {
        console.log('🧪 Mock mode: Using hardcoded metrics');
        return {
            fid: creatorFid,
            followerCount: 5000,
            followerDelta: 150,
            avgLikes: 45,
            isVerified: true,
            timestamp: Date.now()
        };
    }

    try {
        // In production, this would call Farcaster API
        // For MVP, we'll use Neynar API or similar
        const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

        if (!NEYNAR_API_KEY) {
            console.warn('⚠️  NEYNAR_API_KEY not set, using mock data');
            return fetchFarcasterMetrics(creatorFid, true);
        }

        // Fetch user profile (free tier endpoint)
        const profileResponse = await axios.get(
            `https://api.neynar.com/v2/farcaster/user/bulk?fids=${creatorFid}`,
            {
                headers: { 'api_key': NEYNAR_API_KEY }
            }
        );

        const user = profileResponse.data.users[0];

        if (!user) {
            throw new Error(`User with FID ${creatorFid} not found`);
        }

        // Use Neynar user score as engagement proxy (available in free tier)
        // Score ranges from 0-1, we'll scale it to represent avg likes (0-100)
        const neynarScore = user.score || user.experimental?.neynar_user_score || 0;
        const estimatedAvgLikes = Math.floor(neynarScore * 100);

        // Estimate follower delta based on follower/following ratio and score
        // Higher score + good ratio suggests growth
        const followRatio = user.following_count > 0
            ? user.follower_count / user.following_count
            : user.follower_count;

        // Estimate growth: higher score and ratio = more growth
        const growthFactor = Math.min(neynarScore * followRatio * 0.01, 0.05);
        const followerDelta = Math.floor(user.follower_count * growthFactor);

        return {
            fid: creatorFid,
            followerCount: user.follower_count,
            followerDelta: followerDelta,
            avgLikes: estimatedAvgLikes,
            isVerified: user.power_badge || false,
            timestamp: Date.now(),
            username: user.username,
            displayName: user.display_name,
            neynarScore: neynarScore
        };

    } catch (error) {
        console.error('❌ Error fetching Farcaster metrics:', error.message);
        console.log('Falling back to mock mode');
        return fetchFarcasterMetrics(creatorFid, true);
    }
}

/**
 * Compute aura score from metrics
 * @param {Object} metrics - Farcaster metrics
 */
function computeAura(metrics) {
    // Normalize each metric
    const normFollowers = normalizeLog(
        metrics.followerCount,
        NORM_PARAMS.followers.min,
        NORM_PARAMS.followers.max,
        NORM_PARAMS.followers.scale
    );

    const normFollowerDelta = normalizeLog(
        Math.max(1, metrics.followerDelta), // Ensure at least 1 for log
        1, // Start from 1 for log-based normalization
        NORM_PARAMS.followerDelta.max,
        NORM_PARAMS.followerDelta.scale
    );

    const normAvgLikes = normalizeLog(
        metrics.avgLikes,
        NORM_PARAMS.avgLikes.min,
        NORM_PARAMS.avgLikes.max,
        NORM_PARAMS.avgLikes.scale
    );

    const verificationBonus = metrics.isVerified ? WEIGHTS.verification * A_MAX : 0;

    // Spam penalty (simple heuristic: very high follower count but low engagement)
    let spamPenalty = 0;
    if (metrics.followerCount > 10000 && metrics.avgLikes < 10) {
        spamPenalty = 20; // Penalize likely bot accounts
    }

    // Weighted sum
    const aura =
        WEIGHTS.followers * normFollowers +
        WEIGHTS.followerDelta * normFollowerDelta +
        WEIGHTS.avgLikes * normAvgLikes +
        verificationBonus -
        spamPenalty;

    // Clamp to valid range
    const clampedAura = clamp(Math.floor(aura), A_MIN, A_MAX);

    console.log('\n📊 Aura Computation:');
    console.log(`  Followers: ${metrics.followerCount} → ${normFollowers.toFixed(2)} (weight: ${WEIGHTS.followers})`);
    console.log(`  Follower Δ: ${metrics.followerDelta} → ${normFollowerDelta.toFixed(2)} (weight: ${WEIGHTS.followerDelta})`);
    console.log(`  Avg Likes: ${metrics.avgLikes} → ${normAvgLikes.toFixed(2)} (weight: ${WEIGHTS.avgLikes})`);
    console.log(`  Verified: ${metrics.isVerified} → +${verificationBonus.toFixed(2)}`);
    console.log(`  Spam Penalty: -${spamPenalty}`);
    console.log(`  Raw Aura: ${aura.toFixed(2)}`);
    console.log(`  Final Aura: ${clampedAura} (clamped to [${A_MIN}, ${A_MAX}])`);

    return clampedAura;
}

/**
 * Pin data to IPFS using Pinata API
 * @param {Object} data - Data to pin
 * @returns {string} Complete Pinata gateway URL
 */
async function pinToIPFS(data) {
    const PINATA_JWT = process.env.PINATA_JWT;
    const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://indigo-naval-wolverine-789.mypinata.cloud';

    if (!PINATA_JWT) {
        console.warn('⚠️  Pinata JWT not set, skipping IPFS upload');
        const mockHash = 'QmMockHash' + Date.now();
        return `${PINATA_GATEWAY}/ipfs/${mockHash}`;
    }

    try {
        // Use Pinata API directly with JWT authentication
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            {
                pinataContent: data,
                pinataMetadata: {
                    name: `aurafi-metrics-${data.fid}-${data.timestamp}`
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${PINATA_JWT}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const ipfsHash = response.data.IpfsHash;
        const gatewayUrl = `${PINATA_GATEWAY}/ipfs/${ipfsHash}`;

        console.log(`📌 Pinned to IPFS: ${ipfsHash}`);
        console.log(`🔗 Gateway URL: ${gatewayUrl}`);

        return gatewayUrl;

    } catch (error) {
        console.error('❌ Error pinning to IPFS:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        const mockHash = 'QmMockHash' + Date.now();
        return `${PINATA_GATEWAY}/ipfs/${mockHash}`;
    }
}

/**
 * Update vault aura on-chain via AuraOracle
 * @param {string} vaultAddress - Vault contract address
 * @param {number} aura - Computed aura score
 * @param {string} ipfsUrl - Complete IPFS gateway URL
 */
async function updateVaultAura(vaultAddress, aura, ipfsUrl) {
    const RPC_URL = process.env.RPC_URL || 'https://alfajores-forno.celo-testnet.org';
    const PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;
    const ORACLE_CONTRACT_ADDRESS = process.env.ORACLE_CONTRACT_ADDRESS;

    if (!PRIVATE_KEY) {
        throw new Error('ORACLE_PRIVATE_KEY environment variable not set');
    }

    if (!ORACLE_CONTRACT_ADDRESS) {
        throw new Error('ORACLE_CONTRACT_ADDRESS environment variable not set');
    }

    // Connect to network
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`\n🔗 Connected to network: ${RPC_URL}`);
    console.log(`📝 Oracle address: ${wallet.address}`);

    // Load AuraOracle ABI
    const oracleAbiPath = path.join(__dirname, '../out/AuraOracle.sol/AuraOracle.json');

    if (!fs.existsSync(oracleAbiPath)) {
        throw new Error('AuraOracle ABI not found. Run `forge build` first.');
    }

    const oracleArtifact = JSON.parse(fs.readFileSync(oracleAbiPath, 'utf8'));
    const oracleContract = new ethers.Contract(ORACLE_CONTRACT_ADDRESS, oracleArtifact.abi, wallet);

    // Extract IPFS hash from full URL
    // Handles formats like: https://gateway.com/ipfs/QmHash or ipfs://QmHash
    let ipfsHash;
    if (ipfsUrl.includes('/ipfs/')) {
        ipfsHash = ipfsUrl.split('/ipfs/')[1];
    } else if (ipfsUrl.startsWith('ipfs://')) {
        ipfsHash = ipfsUrl.replace('ipfs://', '');
    } else {
        ipfsHash = ipfsUrl; // Assume it's already just the hash
    }

    console.log(`📦 Extracted IPFS hash: ${ipfsHash}`);

    // Check current aura
    try {
        const currentAura = await oracleContract.getAura(vaultAddress);
        console.log(`Current aura: ${currentAura}`);
        console.log(`New aura: ${aura}`);
    } catch (error) {
        console.warn('Could not fetch current aura:', error.message);
    }

    // Send transaction to AuraOracle.pushAura
    console.log(`\n📤 Sending pushAura transaction to AuraOracle...`);
    console.log(`🏦 Vault: ${vaultAddress}`);
    console.log(`📊 Aura: ${aura}`);
    console.log(`🔗 IPFS Hash: ${ipfsHash}`);
    const tx = await oracleContract.pushAura(vaultAddress, aura, ipfsHash);
    console.log(`Transaction hash: ${tx.hash}`);

    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();

    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);

    return receipt;
}

/**
 * Main execution function
 */
async function main() {
    const args = process.argv.slice(2);

    // Parse command line arguments
    let vaultAddress = null;
    let creatorFid = null;
    let creatorUsername = null;
    let mockMode = false;
    let dryRun = false;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--vault' && args[i + 1]) {
            vaultAddress = args[i + 1];
            i++;
        } else if (args[i] === '--fid' && args[i + 1]) {
            creatorFid = args[i + 1];
            i++;
        } else if (args[i] === '--username' && args[i + 1]) {
            creatorUsername = args[i + 1];
            i++;
        } else if (args[i] === '--mock') {
            mockMode = true;
        } else if (args[i] === '--dry-run') {
            dryRun = true;
        } else if (args[i] === '--help') {
            printHelp();
            process.exit(0);
        }
    }

    if (!vaultAddress || (!creatorFid && !creatorUsername)) {
        console.error('❌ Missing required arguments');
        printHelp();
        process.exit(1);
    }

    console.log('🌟 AuraFi Oracle');
    console.log('================\n');
    console.log(`Vault: ${vaultAddress}`);

    if (creatorUsername) {
        console.log(`Creator Username: @${creatorUsername}`);
    } else {
        console.log(`Creator FID: ${creatorFid}`);
    }

    console.log(`Mode: ${mockMode ? 'Mock' : 'Live'}`);
    console.log(`Dry Run: ${dryRun ? 'Yes' : 'No'}\n`);

    try {
        // Step 1: Resolve username to FID if needed
        let finalFid = creatorFid;
        if (creatorUsername) {
            console.log('🔍 Resolving username to FID...');
            finalFid = await resolveFarcasterUsername(creatorUsername, mockMode);
        }

        // Step 2: Fetch metrics
        console.log('📡 Fetching Farcaster metrics...');
        const metrics = await fetchFarcasterMetrics(finalFid, mockMode);
        console.log(`✅ Metrics fetched for @${metrics.username || finalFid}`);

        // Step 3: Compute aura
        const aura = computeAura(metrics);

        // Step 4: Pin to IPFS
        console.log('\n📌 Pinning metrics to IPFS...');
        const metricsData = {
            ...metrics,
            aura,
            computation: {
                weights: WEIGHTS,
                normParams: NORM_PARAMS,
                version: '1.0.0'
            }
        };
        const ipfsUrl = await pinToIPFS(metricsData);

        // Step 5: Update vault (unless dry run)
        if (dryRun) {
            console.log('\n🏁 Dry run complete. Would update vault with:');
            console.log(`  Aura: ${aura}`);
            console.log(`  IPFS URL: ${ipfsUrl}`);
        } else {
            const receipt = await updateVaultAura(vaultAddress, aura, ipfsUrl);
            console.log('\n🎉 Oracle update complete!');
        }

    } catch (error) {
        console.error('\n❌ Oracle execution failed:', error.message);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

function printHelp() {
    console.log(`
AuraFi Oracle - Compute and update creator aura scores

Usage:
  node oracle.js --vault <address> (--fid <farcaster-id> | --username <username>) [options]

Required:
  --vault <address>    Vault contract address
  
Creator Identification (choose one):
  --fid <id>           Creator's Farcaster ID (numeric)
  --username <name>    Creator's Farcaster username (without @)

Options:
  --mock               Use mock data instead of fetching from Farcaster
  --dry-run            Compute aura but don't send transaction
  --help               Show this help message

Environment Variables:
  NEYNAR_API_KEY           Neynar API key for Farcaster data
  PINATA_JWT               Pinata JWT token for IPFS
  PINATA_GATEWAY           Pinata gateway URL (default: https://indigo-naval-wolverine-789.mypinata.cloud)
  ORACLE_PRIVATE_KEY       Private key for oracle wallet
  ORACLE_CONTRACT_ADDRESS  Address of deployed AuraOracle contract
  RPC_URL                  RPC endpoint (default: Celo Alfajores)

Examples:
  # Using username (recommended)
  node oracle.js --vault 0x123... --username vitalik --mock
  
  # Using FID directly
  node oracle.js --vault 0x123... --fid 12345 --mock

  # Dry run with live data
  node oracle.js --vault 0x123... --username dwr --dry-run

  # Full execution
  node oracle.js --vault 0x123... --username balajis
`);
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export functions for testing
module.exports = {
    resolveFarcasterUsername,
    fetchFarcasterMetrics,
    computeAura,
    pinToIPFS,
    updateVaultAura,
    clamp,
    normalizeLog
};
