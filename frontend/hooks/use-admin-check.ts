'use client'

import { useReadContract } from 'wagmi'
import { getContractAddress } from '../lib/config'
import { TREASURY_ABI } from '../lib/abis'

/**
 * Hook to check if a user is the treasury admin (owner)
 */
export function useAdminCheck(address?: `0x${string}`) {
  const { data: treasuryOwner } = useReadContract({
    address: getContractAddress('treasury'),
    abi: TREASURY_ABI,
    functionName: 'owner',
    query: {
      enabled: !!address,
    },
  })

  const isAdmin = address && treasuryOwner && 
    address.toLowerCase() === treasuryOwner.toLowerCase()

  return {
    isAdmin: !!isAdmin,
    treasuryOwner,
  }
}