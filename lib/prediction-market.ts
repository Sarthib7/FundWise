import { db } from './firebase'
import { ref, push, set, get, update, onValue } from 'firebase/database'

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
  durationHours: number
): Promise<string> {
  try {
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
        voters: []
      })),
      totalStake: 0,
      status: 'active'
    }

    await set(newProposalRef, proposal)
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
      proposals.push(child.val())
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

    // Check if user already voted
    const hasVoted = proposal.options.some(opt => opt.voters.includes(voter))
    if (hasVoted) {
      throw new Error('You have already placed a bet on this proposal')
    }

    proposal.options[optionIndex].stake += amount
    proposal.options[optionIndex].voters.push(voter)
    proposal.totalStake += amount

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
      proposals.push(child.val())
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

