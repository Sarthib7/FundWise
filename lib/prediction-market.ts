import { db } from './firebase'
import { ref, push, set, get, update, onValue } from 'firebase/database'
import { syncWithKalshi, isKalshiAvailable, placeKalshiBet } from './kalshi-integration'

export interface PredictionProposal {
  id: string
  circleId: string
  creator: string
  createdAt: number
  
  // Proposal details
  title: string
  description: string
  closesAt: number // timestamp when voting closes
  
  // Market details
  options: PredictionOption[]
  totalStake: number
  
  // Status
  status: 'active' | 'closed' | 'resolved'
  winningOption?: string
  
  // Kalshi integration
  kalshiTicker?: string
  kalshiSynced?: boolean
  kalshiSyncMessage?: string
}

export interface PredictionOption {
  id: string
  label: string
  stake: number
  voters: string[] // wallet addresses
}

export interface Vote {
  proposalId: string
  voter: string
  optionId: string
  amount: number
  timestamp: number
}

/**
 * Create a new prediction proposal
 */
export async function createProposal(
  circleId: string,
  creator: string,
  title: string,
  description: string,
  options: string[],
  durationHours: number,
  kalshiTicker?: string
): Promise<string> {
  try {
    // Check if circle already has a proposal
    const existingProposals = await getCircleProposals(circleId)
    if (existingProposals.length > 0) {
      throw new Error('This circle already has an active prediction proposal. Only one proposal per circle is allowed.')
    }

    const proposalsRef = ref(db, `predictions/${circleId}`)
    const newProposalRef = push(proposalsRef)
    const proposalId = newProposalRef.key!

    const closesAt = Date.now() + (durationHours * 60 * 60 * 1000)

    const proposal: PredictionProposal = {
      id: proposalId,
      circleId,
      creator,
      createdAt: Date.now(),
      title,
      description,
      closesAt,
      options: options.map(label => ({
        id: `opt_${Math.random().toString(36).substring(7)}`,
        label,
        stake: 0,
        voters: [] // Always initialize as empty array
      })),
      totalStake: 0,
      status: 'active'
    }

    await set(newProposalRef, proposal)
    
    // If Kalshi ticker provided directly, use it
    if (kalshiTicker) {
      console.log('[PredictionMarket] ✅ Linking to Kalshi market:', kalshiTicker)
      await update(newProposalRef, {
        kalshiTicker: kalshiTicker,
        kalshiSynced: true,
        kalshiSyncMessage: `Linked to Kalshi market: ${kalshiTicker}`
      })
    } else {
      // Otherwise, try to sync with Kalshi if available
      console.log('[PredictionMarket] Syncing with Kalshi...')
      const kalshiSync = await syncWithKalshi(proposalId, {
        title,
        description,
        options,
        totalStake: 0,
        closesAt
      })
      
      // Update proposal with Kalshi sync status
      if (kalshiSync.synced) {
        await update(newProposalRef, {
          kalshiTicker: kalshiSync.kalshiTicker,
          kalshiSynced: true,
          kalshiSyncMessage: kalshiSync.message
        })
        console.log('[PredictionMarket] ✅ Synced with Kalshi:', kalshiSync.kalshiTicker)
      } else {
        await update(newProposalRef, {
          kalshiSynced: false,
          kalshiSyncMessage: kalshiSync.message
        })
        console.log('[PredictionMarket] ℹ️ Running in local mode:', kalshiSync.message)
      }
    }
    
    return proposalId
  } catch (error) {
    console.error('Error creating proposal:', error)
    throw error
  }
}

/**
 * Get all proposals for a circle
 */
export async function getCircleProposals(circleId: string): Promise<PredictionProposal[]> {
  try {
    const proposalsRef = ref(db, `predictions/${circleId}`)
    const snapshot = await get(proposalsRef)
    
    if (!snapshot.exists()) {
      return []
    }

    const proposals: PredictionProposal[] = []
    snapshot.forEach((child) => {
      const proposal = child.val()
      // Ensure voters arrays exist for all options
      if (proposal.options) {
        proposal.options = proposal.options.map((opt: any) => ({
          ...opt,
          voters: opt.voters || []
        }))
      }
      proposals.push(proposal)
    })

    return proposals.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error('Error fetching proposals:', error)
    return []
  }
}

/**
 * Place a bet on a proposal option
 */
export async function placeBet(
  proposalId: string,
  circleId: string,
  voter: string,
  optionId: string,
  amount: number
): Promise<void> {
  try {
    const proposalRef = ref(db, `predictions/${circleId}/${proposalId}`)
    const snapshot = await get(proposalRef)
    
    if (!snapshot.exists()) {
      throw new Error('Proposal not found')
    }

    const proposal: PredictionProposal = snapshot.val()
    
    // Ensure voters arrays exist for all options
    if (proposal.options) {
      proposal.options = proposal.options.map((opt: any) => ({
        ...opt,
        voters: opt.voters || [],
        stake: opt.stake || 0
      }))
    }
    
    if (proposal.status !== 'active') {
      throw new Error('Proposal is not active')
    }

    if (Date.now() > proposal.closesAt) {
      throw new Error('Voting has closed')
    }

    // Update option
    const optionIndex = proposal.options.findIndex(opt => opt.id === optionId)
    if (optionIndex === -1) {
      throw new Error('Option not found')
    }

    // Check if user already voted (with defensive checks)
    const hasVoted = proposal.options.some(opt => 
      opt.voters && Array.isArray(opt.voters) && opt.voters.includes(voter)
    )
    if (hasVoted) {
      throw new Error('You have already placed a bet on this proposal')
    }

    // Ensure voters array exists before pushing
    if (!proposal.options[optionIndex].voters) {
      proposal.options[optionIndex].voters = []
    }

    proposal.options[optionIndex].stake = (proposal.options[optionIndex].stake || 0) + amount
    proposal.options[optionIndex].voters.push(voter)
    proposal.totalStake = (proposal.totalStake || 0) + amount

    await update(proposalRef, {
      options: proposal.options,
      totalStake: proposal.totalStake
    })

    // Record the vote
    const voteRef = ref(db, `votes/${proposalId}/${voter}`)
    const vote: Vote = {
      proposalId,
      voter,
      optionId,
      amount,
      timestamp: Date.now()
    }
    await set(voteRef, vote)
    
    // Sync bet with Kalshi if market is linked
    if (proposal.kalshiTicker && isKalshiAvailable()) {
      console.log('[PredictionMarket] Syncing bet with Kalshi...')
      const selectedOption = proposal.options[optionIndex]
      
      // For binary markets (Yes/No), map to Kalshi sides
      const side = selectedOption.label.toLowerCase().includes('yes') ? 'yes' : 'no'
      
      try {
        await placeKalshiBet(proposal.kalshiTicker, side, amount)
        console.log('[PredictionMarket] ✅ Bet synced with Kalshi')
      } catch (kalshiError) {
        console.warn('[PredictionMarket] Kalshi bet sync failed, continuing with local bet:', kalshiError)
        // Don't throw - local bet is still valid even if Kalshi sync fails
      }
    }
  } catch (error) {
    console.error('Error placing bet:', error)
    throw error
  }
}

/**
 * Subscribe to proposals updates for a circle
 */
export function subscribeToProposals(
  circleId: string,
  callback: (proposals: PredictionProposal[]) => void
): () => void {
  const proposalsRef = ref(db, `predictions/${circleId}`)
  
  const unsubscribe = onValue(proposalsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }

    const proposals: PredictionProposal[] = []
    snapshot.forEach((child) => {
      const proposal = child.val()
      // Ensure voters arrays exist for all options
      if (proposal.options) {
        proposal.options = proposal.options.map((opt: any) => ({
          ...opt,
          voters: opt.voters || []
        }))
      }
      proposals.push(proposal)
    })

    callback(proposals.sort((a, b) => b.createdAt - a.createdAt))
  })

  return unsubscribe
}

/**
 * Resolve a proposal (admin only)
 */
export async function resolveProposal(
  proposalId: string,
  circleId: string,
  winningOptionId: string
): Promise<void> {
  try {
    const proposalRef = ref(db, `predictions/${circleId}/${proposalId}`)
    
    await update(proposalRef, {
      status: 'resolved',
      winningOption: winningOptionId
    })
  } catch (error) {
    console.error('Error resolving proposal:', error)
    throw error
  }
}

/**
 * Calculate payout for a voter
 */
export function calculatePayout(
  proposal: PredictionProposal,
  voter: string
): number {
  if (proposal.status !== 'resolved' || !proposal.winningOption) {
    return 0
  }

  const winningOption = proposal.options.find(opt => opt.id === proposal.winningOption)
  if (!winningOption) {
    return 0
  }

  if (!winningOption.voters.includes(voter)) {
    return 0
  }

  // Simple proportional payout
  // Payout = (user's stake / total winning stake) * total pot
  const userVote = winningOption.voters.filter(v => v === voter).length
  const totalWinningStake = winningOption.stake
  
  return (userVote / totalWinningStake) * proposal.totalStake
}

