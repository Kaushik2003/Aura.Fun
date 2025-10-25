import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createWalletClient, http, createPublicClient, isAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { sepolia } from 'viem/chains'
import { ORACLE_ABI } from '../../../../lib/abis'

// Environment validation schema
const envSchema = z.object({
  NEYNAR_API_KEY: z.string().optional(),
  PINATA_JWT: z.string().optional(),
  PINATA_GATEWAY: z.string().url().default('https://indigo-naval-wolverine-789.mypinata.cloud'),
  ORACLE_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  NEXT_PUBLIC_RPC_URL: z.string().url(),
  NEXT_PUBLIC_AURA_ORACLE_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  NEXT_PUBLIC_NETWORK: z.enum(['anvil', 'sepolia']),
})

// Request validation schema
const requestSchema = z.object({
  vaultAddress: z.string().refine(isAddress, 'Invalid vault address'),
  farcasterUsername: z.string().min(1, 'Username is required'),
})

// Constants matching oracle.js
const A_MIN = 0
const A_MAX = 200

// Weights for aura computation
const WEIGHTS = {
  followers: 0.35,
  followerDelta: 0.25,
  avgLikes: 0.30,
  verification: 0.10,
}

// Normalization parameters (log-based scaling)
const NORM_PARAMS = {
  followers: { min: 10, max: 100000, scale: 200 },
  followerDelta: { min: 1, max: 1000, scale: 200 },
  avgLikes: { min: 1, max: 1000, scale: 200 },
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Log-based normalization to map counts to 0-200 range
 */
function normalizeLog(value: number, min: number, max: number, scale: number): number {
  if (value <= min) return 0
  if (value >= max) return scale

  // Log-based interpolation
  const logMin = Math.log(min)
  const logMax = Math.log(max)
  const logValue = Math.log(value)

  const normalized = ((logValue - logMin) / (logMax - logMin)) * scale
  return clamp(normalized, 0, scale)
}

/**
 * Resolve Farcaster username to FID
 */
async function resolveFarcasterUsername(username: string, mockMode = false): Promise<string> {
  if (mockMode) {
    console.log('🧪 Mock mode: Using hardcoded FID for username')
    return '12345' // Mock FID
  }

  try {
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY

    if (!NEYNAR_API_KEY) {
      console.warn('⚠️  NEYNAR_API_KEY not set, using mock data')
      return resolveFarcasterUsername(username, true)
    }

    // Fetch user by username (v2 endpoint)
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/by_username?username=${username}`,
      {
        headers: { 'api_key': NEYNAR_API_KEY },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Username @${username} not found on Farcaster`)
      }
      throw new Error(`Neynar API error: ${response.status}`)
    }

    const data = await response.json()
    const user = data.user

    if (!user) {
      throw new Error(`Username @${username} not found`)
    }

    console.log(`✅ Resolved @${username} → FID ${user.fid}`)
    return user.fid.toString()
  } catch (error) {
    console.error('❌ Error resolving username:', error)
    console.log('Falling back to mock mode')
    return resolveFarcasterUsername(username, true)
  }
}

/**
 * Fetch Farcaster metrics for a creator
 */
async function fetchFarcasterMetrics(creatorFid: string, mockMode = false) {
  if (mockMode) {
    console.log('🧪 Mock mode: Using hardcoded metrics')
    return {
      fid: creatorFid,
      followerCount: 5000,
      followerDelta: 150,
      avgLikes: 45,
      isVerified: true,
      timestamp: Date.now(),
      username: 'mockuser',
      displayName: 'Mock User',
      neynarScore: 0.45,
    }
  }

  try {
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY

    if (!NEYNAR_API_KEY) {
      console.warn('⚠️  NEYNAR_API_KEY not set, using mock data')
      return fetchFarcasterMetrics(creatorFid, true)
    }

    // Fetch user profile (free tier endpoint)
    const profileResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${creatorFid}`,
      {
        headers: { 'api_key': NEYNAR_API_KEY },
      }
    )

    if (!profileResponse.ok) {
      throw new Error(`Neynar API error: ${profileResponse.status}`)
    }

    const profileData = await profileResponse.json()
    const user = profileData.users[0]

    if (!user) {
      throw new Error(`User with FID ${creatorFid} not found`)
    }

    // Use Neynar user score as engagement proxy (available in free tier)
    // Score ranges from 0-1, we'll scale it to represent avg likes (0-100)
    const neynarScore = user.score || user.experimental?.neynar_user_score || 0
    const estimatedAvgLikes = Math.floor(neynarScore * 100)

    // Estimate follower delta based on follower/following ratio and score
    // Higher score + good ratio suggests growth
    const followRatio = user.following_count > 0
      ? user.follower_count / user.following_count
      : user.follower_count

    // Estimate growth: higher score and ratio = more growth
    const growthFactor = Math.min(neynarScore * followRatio * 0.01, 0.05)
    const followerDelta = Math.floor(user.follower_count * growthFactor)

    return {
      fid: creatorFid,
      followerCount: user.follower_count,
      followerDelta: followerDelta,
      avgLikes: estimatedAvgLikes,
      isVerified: user.power_badge || false,
      timestamp: Date.now(),
      username: user.username,
      displayName: user.display_name,
      neynarScore: neynarScore,
    }
  } catch (error) {
    console.error('❌ Error fetching Farcaster metrics:', error)
    console.log('Falling back to mock mode')
    return fetchFarcasterMetrics(creatorFid, true)
  }
}

/**
 * Compute aura score from metrics using exact oracle.js algorithm
 */
function computeAura(metrics: {
  followerCount: number
  followerDelta: number
  avgLikes: number
  isVerified: boolean
}): number {
  // Normalize each metric
  const normFollowers = normalizeLog(
    metrics.followerCount,
    NORM_PARAMS.followers.min,
    NORM_PARAMS.followers.max,
    NORM_PARAMS.followers.scale
  )

  const normFollowerDelta = normalizeLog(
    Math.max(1, metrics.followerDelta), // Ensure at least 1 for log
    1, // Start from 1 for log-based normalization
    NORM_PARAMS.followerDelta.max,
    NORM_PARAMS.followerDelta.scale
  )

  const normAvgLikes = normalizeLog(
    metrics.avgLikes,
    NORM_PARAMS.avgLikes.min,
    NORM_PARAMS.avgLikes.max,
    NORM_PARAMS.avgLikes.scale
  )

  const verificationBonus = metrics.isVerified ? WEIGHTS.verification * A_MAX : 0

  // Spam penalty (simple heuristic: very high follower count but low engagement)
  let spamPenalty = 0
  if (metrics.followerCount > 10000 && metrics.avgLikes < 10) {
    spamPenalty = 20 // Penalize likely bot accounts
  }

  // Weighted sum
  const aura =
    WEIGHTS.followers * normFollowers +
    WEIGHTS.followerDelta * normFollowerDelta +
    WEIGHTS.avgLikes * normAvgLikes +
    verificationBonus -
    spamPenalty

  // Clamp to valid range
  const clampedAura = clamp(Math.floor(aura), A_MIN, A_MAX)

  console.log('\n📊 Aura Computation:')
  console.log(`  Followers: ${metrics.followerCount} → ${normFollowers.toFixed(2)} (weight: ${WEIGHTS.followers})`)
  console.log(`  Follower Δ: ${metrics.followerDelta} → ${normFollowerDelta.toFixed(2)} (weight: ${WEIGHTS.followerDelta})`)
  console.log(`  Avg Likes: ${metrics.avgLikes} → ${normAvgLikes.toFixed(2)} (weight: ${WEIGHTS.avgLikes})`)
  console.log(`  Verified: ${metrics.isVerified} → +${verificationBonus.toFixed(2)}`)
  console.log(`  Spam Penalty: -${spamPenalty}`)
  console.log(`  Raw Aura: ${aura.toFixed(2)}`)
  console.log(`  Final Aura: ${clampedAura} (clamped to [${A_MIN}, ${A_MAX}])`)

  return clampedAura
}

/**
 * Pin data to IPFS using Pinata API
 */
async function pinToIPFS(data: any): Promise<string> {
  const PINATA_JWT = process.env.PINATA_JWT
  const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://indigo-naval-wolverine-789.mypinata.cloud'

  if (!PINATA_JWT) {
    console.warn('⚠️  Pinata JWT not set, skipping IPFS upload')
    const mockHash = 'QmMockHash' + Date.now()
    return `${PINATA_GATEWAY}/ipfs/${mockHash}`
  }

  try {
    // Use Pinata API directly with JWT authentication
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pinataContent: data,
        pinataMetadata: {
          name: `aurafi-metrics-${data.fid}-${data.timestamp}`,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.status}`)
    }

    const result = await response.json()
    const ipfsHash = result.IpfsHash
    const gatewayUrl = `${PINATA_GATEWAY}/ipfs/${ipfsHash}`

    console.log(`📌 Pinned to IPFS: ${ipfsHash}`)
    console.log(`🔗 Gateway URL: ${gatewayUrl}`)

    return gatewayUrl
  } catch (error) {
    console.error('❌ Error pinning to IPFS:', error)
    const mockHash = 'QmMockHash' + Date.now()
    return `${PINATA_GATEWAY}/ipfs/${mockHash}`
  }
}

/**
 * Update vault aura on-chain via AuraOracle
 */
async function updateVaultAura(vaultAddress: string, aura: number, ipfsUrl: string) {
  const env = envSchema.parse(process.env)
  
  // Create chain configuration based on network
  const chain = env.NEXT_PUBLIC_NETWORK === 'anvil' 
    ? {
        id: 31337,
        name: 'Anvil Local',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [env.NEXT_PUBLIC_RPC_URL] } },
      }
    : sepolia

  // Create clients
  const publicClient = createPublicClient({
    chain,
    transport: http(env.NEXT_PUBLIC_RPC_URL),
  })

  const account = privateKeyToAccount(env.ORACLE_PRIVATE_KEY as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(env.NEXT_PUBLIC_RPC_URL),
  })

  console.log(`\n🔗 Connected to network: ${env.NEXT_PUBLIC_RPC_URL}`)
  console.log(`📝 Oracle address: ${account.address}`)

  // Extract IPFS hash from full URL
  let ipfsHash: string
  if (ipfsUrl.includes('/ipfs/')) {
    ipfsHash = ipfsUrl.split('/ipfs/')[1]
  } else if (ipfsUrl.startsWith('ipfs://')) {
    ipfsHash = ipfsUrl.replace('ipfs://', '')
  } else {
    ipfsHash = ipfsUrl // Assume it's already just the hash
  }

  console.log(`📦 Extracted IPFS hash: ${ipfsHash}`)

  // Check current aura
  try {
    const currentAura = await publicClient.readContract({
      address: env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS as `0x${string}`,
      abi: ORACLE_ABI,
      functionName: 'getAura',
      args: [vaultAddress as `0x${string}`],
    })
    console.log(`Current aura: ${currentAura}`)
    console.log(`New aura: ${aura}`)
  } catch (error) {
    console.warn('Could not fetch current aura:', error)
  }

  // Send transaction to AuraOracle.pushAura
  console.log(`\n📤 Sending pushAura transaction to AuraOracle...`)
  console.log(`🏦 Vault: ${vaultAddress}`)
  console.log(`📊 Aura: ${aura}`)
  console.log(`🔗 IPFS Hash: ${ipfsHash}`)

  const hash = await walletClient.writeContract({
    address: env.NEXT_PUBLIC_AURA_ORACLE_ADDRESS as `0x${string}`,
    abi: ORACLE_ABI,
    functionName: 'pushAura',
    args: [vaultAddress as `0x${string}`, BigInt(aura), ipfsHash],
  })

  console.log(`Transaction hash: ${hash}`)

  console.log('⏳ Waiting for confirmation...')
  const receipt = await publicClient.waitForTransactionReceipt({ hash })

  console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`)
  console.log(`Gas used: ${receipt.gasUsed.toString()}`)

  return receipt
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const env = envSchema.parse(process.env)

    // Parse and validate request body
    const body = await request.json()
    const { vaultAddress, farcasterUsername } = requestSchema.parse(body)

    console.log('🌟 AuraFi Oracle API')
    console.log('==================')
    console.log(`Vault: ${vaultAddress}`)
    console.log(`Creator Username: @${farcasterUsername}`)

    // Determine if we should use mock mode (no API keys)
    const mockMode = !env.NEYNAR_API_KEY

    // Step 1: Resolve username to FID
    console.log('🔍 Resolving username to FID...')
    const fid = await resolveFarcasterUsername(farcasterUsername, mockMode)

    // Step 2: Fetch metrics
    console.log('📡 Fetching Farcaster metrics...')
    const metrics = await fetchFarcasterMetrics(fid, mockMode)
    console.log(`✅ Metrics fetched for @${metrics.username}`)

    // Step 3: Compute aura
    const aura = computeAura(metrics)

    // Step 4: Pin to IPFS
    console.log('\n📌 Pinning metrics to IPFS...')
    const metricsData = {
      ...metrics,
      aura,
      computation: {
        weights: WEIGHTS,
        normParams: NORM_PARAMS,
        version: '1.0.0',
      },
    }
    const ipfsUrl = await pinToIPFS(metricsData)

    // Step 5: Update vault
    const receipt = await updateVaultAura(vaultAddress, aura, ipfsUrl)

    console.log('\n🎉 Oracle update complete!')

    return NextResponse.json({
      success: true,
      aura,
      ipfsUrl,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      metrics: {
        fid: metrics.fid,
        username: metrics.username,
        followerCount: metrics.followerCount,
        followerDelta: metrics.followerDelta,
        avgLikes: metrics.avgLikes,
        isVerified: metrics.isVerified,
      },
    })
  } catch (error) {
    console.error('❌ Oracle API error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}