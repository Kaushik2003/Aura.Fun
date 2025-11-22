#!/usr/bin/env node

/**
 * Simple validation script to test environment configuration
 * This can be run with: node scripts/validate-config.js
 */

const fs = require('fs')
const path = require('path')

function validateEnvFile(filePath, networkType) {
    console.log(`\n🔍 Validating ${filePath}...`)

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`)
        return false
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'))

    const requiredVars = [
        'NEXT_PUBLIC_NETWORK',
        'NEXT_PUBLIC_RPC_URL',
        'NEXT_PUBLIC_VAULT_FACTORY_ADDRESS',
        'NEXT_PUBLIC_AURA_ORACLE_ADDRESS',
        'NEXT_PUBLIC_TREASURY_ADDRESS',
        'NEXT_PUBLIC_CHAIN_ID',
        'NEXT_PUBLIC_CHAIN_NAME'
    ]

    const foundVars = {}
    lines.forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            foundVars[key.trim()] = value.trim()
        }
    })

    let isValid = true
    requiredVars.forEach(varName => {
        if (!foundVars[varName]) {
            console.error(`❌ Missing variable: ${varName}`)
            isValid = false
        } else {
            console.log(`✅ Found: ${varName}=${foundVars[varName]}`)
        }
    })

    // Validate network-specific values
    if (foundVars.NEXT_PUBLIC_NETWORK) {
        if (networkType === 'anvil' && foundVars.NEXT_PUBLIC_NETWORK !== 'anvil') {
            console.error(`❌ Expected NEXT_PUBLIC_NETWORK=anvil, got: ${foundVars.NEXT_PUBLIC_NETWORK}`)
            isValid = false
        }
        if (networkType === 'sepolia' && foundVars.NEXT_PUBLIC_NETWORK !== 'sepolia') {
            console.error(`❌ Expected NEXT_PUBLIC_NETWORK=sepolia, got: ${foundVars.NEXT_PUBLIC_NETWORK}`)
            isValid = false
        }
    }

    // Check for placeholder addresses
    const placeholderAddress = '0x0000000000000000000000000000000000000000'
    const addressVars = ['NEXT_PUBLIC_VAULT_FACTORY_ADDRESS', 'NEXT_PUBLIC_AURA_ORACLE_ADDRESS', 'NEXT_PUBLIC_TREASURY_ADDRESS']

    addressVars.forEach(varName => {
        if (foundVars[varName] === placeholderAddress) {
            console.warn(`⚠️  Placeholder address found for ${varName} - needs to be updated after deployment`)
        }
    })

    return isValid
}

function main() {
    console.log('🚀 Aura.farm Frontend Configuration Validator')

    const envLocalPath = path.join(__dirname, '../.env.local')
    const envProdPath = path.join(__dirname, '../.env.production')

    const localValid = validateEnvFile(envLocalPath, 'anvil')
    const prodValid = validateEnvFile(envProdPath, 'sepolia')

    console.log('\n📋 Summary:')
    console.log(`Local (.env.local): ${localValid ? '✅ Valid' : '❌ Invalid'}`)
    console.log(`Production (.env.production): ${prodValid ? '✅ Valid' : '❌ Invalid'}`)

    if (localValid && prodValid) {
        console.log('\n🎉 All configuration files are valid!')
        console.log('\n📝 Next steps:')
        console.log('1. Run deploy-and-test.sh to deploy contracts to Anvil')
        console.log('2. Update .env.local with deployed contract addresses')
        console.log('3. For Sepolia: deploy contracts and update .env.production')
    } else {
        console.log('\n❌ Configuration validation failed')
        process.exit(1)
    }
}

main()