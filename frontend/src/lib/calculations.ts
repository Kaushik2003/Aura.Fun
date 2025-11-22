/**
 * Utility functions for Aura.farm protocol calculations
 */

/**
 * Calculate the token peg (price) based on aura score
 * Formula: P = BASE_PRICE × (1 + K × (aura/A_REF - 1))
 * Matches CreatorVault.sol calculatePeg() exactly
 * 
 * @param aura - Aura score (0-200)
 * @returns Token peg in CELO as bigint (18 decimals)
 */
export function calculatePeg(aura: number): bigint {
  // Constants matching CreatorVault.sol
  const BASE_PRICE = 0.001  // 0.001 CELO
  const K = 0.5             // Sensitivity
  const A_REF = 100         // Reference aura
  const P_MIN = 0.0001      // Minimum peg
  const P_MAX = 0.01        // Maximum peg

  // Clamp aura to valid range [0, 200]
  const clampedAura = Math.max(0, Math.min(200, aura))

  // Calculate peg: BASE_PRICE × (1 + K × (aura/A_REF - 1))
  const pegFloat = BASE_PRICE * (1 + K * (clampedAura / A_REF - 1))

  // Clamp to [P_MIN, P_MAX]
  const clampedPeg = Math.max(P_MIN, Math.min(P_MAX, pegFloat))

  // Convert to bigint with 18 decimals
  return BigInt(Math.floor(clampedPeg * 1e18))
}

/**
 * Calculate the supply cap based on aura score and base capacity
 * Formula: supplyCap = baseCap * (1 + 0.75 * (aura - 100) / 100)
 * 
 * @param aura - Aura score (0-200)
 * @param baseCap - Base capacity as bigint (18 decimals)
 * @returns Supply cap as bigint (18 decimals)
 */
export function calculateSupplyCap(aura: number, baseCap: bigint): bigint {
  // Clamp aura to valid range
  const clampedAura = Math.max(0, Math.min(200, aura))

  // Calculate multiplier: 1 + 0.75 * (aura - 100) / 100
  const multiplier = 1 + 0.75 * (clampedAura - 100) / 100

  // Clamp multiplier to [0.25, 4] as per contract logic
  const clampedMultiplier = Math.max(0.25, Math.min(4, multiplier))

  // Apply multiplier to base capacity
  const baseCapFloat = Number(baseCap) / 1e18
  const supplyCapFloat = baseCapFloat * clampedMultiplier

  // Convert back to bigint with 18 decimals
  return BigInt(Math.floor(supplyCapFloat * 1e18))
}

/**
 * Calculate required collateral for minting tokens
 * Formula: requiredCollateral = quantity * peg * 1.5
 * 
 * @param quantity - Number of tokens to mint (as bigint with 18 decimals)
 * @param peg - Token peg in CELO (as bigint with 18 decimals)
 * @returns Required collateral as bigint (18 decimals)
 */
export function calculateRequiredCollateral(quantity: bigint, peg: bigint): bigint {
  // Calculate: quantity * peg * 1.5, but divide by 1e18 to handle double decimals
  return (quantity * peg * BigInt(15)) / (BigInt(10) * BigInt(1e18))
}

/**
 * Calculate mint fee (0.5% of required collateral)
 * 
 * @param requiredCollateral - Required collateral amount (as bigint with 18 decimals)
 * @returns Mint fee as bigint (18 decimals)
 */
export function calculateMintFee(requiredCollateral: bigint): bigint {
  // Calculate 0.5% fee: requiredCollateral * 0.005
  return (requiredCollateral * BigInt(5)) / BigInt(1000)
}

/**
 * Calculate vault health ratio
 * Formula: health = (totalCollateral / (totalSupply * peg)) * 100
 * 
 * @param totalCollateral - Total collateral in vault (as bigint with 18 decimals)
 * @param totalSupply - Total token supply (as bigint with 18 decimals)
 * @param peg - Token peg in CELO (as bigint with 18 decimals)
 * @returns Health ratio as percentage (number)
 */
export function calculateHealth(
  totalCollateral: bigint,
  totalSupply: bigint,
  peg: bigint
): number {
  if (totalSupply === 0n) {
    return 0
  }

  // Calculate: (totalCollateral / (totalSupply * peg)) * 100
  // Both totalCollateral and (totalSupply * peg) are in wei, so we need to handle decimals properly
  const numerator = totalCollateral * BigInt(100) * BigInt(1e18)
  const denominator = totalSupply * peg

  if (denominator === 0n) {
    return 0
  }

  return Number(numerator / denominator)
}

/**
 * Calculate liquidation parameters
 * 
 * @param totalCollateral - Current total collateral
 * @param totalSupply - Current total supply
 * @param peg - Current token peg
 * @param injectedAmount - Amount of CELO being injected
 * @returns Object with tokensToRemove, bounty, and healthAfter
 */
export function calculateLiquidation(
  totalCollateral: bigint,
  totalSupply: bigint,
  peg: bigint,
  injectedAmount: bigint
) {
  const newTotalCollateral = totalCollateral + injectedAmount

  // Calculate tokens to remove to reach 150% health
  // tokensToRemove = totalSupply - (newTotalCollateral / (peg * 1.5))
  // Handle decimals properly: newTotalCollateral is in wei, peg is in wei
  const targetSupply = (newTotalCollateral * BigInt(1e18)) / (peg * BigInt(15) / BigInt(10))
  const tokensToRemove = totalSupply > targetSupply ? totalSupply - targetSupply : 0n

  // Calculate bounty (1% of injected amount)
  const bounty = (injectedAmount * BigInt(1)) / BigInt(100)

  // Calculate health after liquidation
  const finalSupply = totalSupply - tokensToRemove
  const healthAfter = calculateHealth(newTotalCollateral, finalSupply, peg)

  return {
    tokensToRemove,
    bounty,
    healthAfter
  }
}