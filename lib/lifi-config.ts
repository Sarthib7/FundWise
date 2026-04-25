import { ChainType, EVM, Solana, config, createConfig, getChains } from "@lifi/sdk"
import type { SignerWalletAdapter } from "@solana/wallet-adapter-base"
import type { Address } from "viem"
import { createWalletClient, custom } from "viem"
import { arbitrum, base, mainnet, optimism, polygon } from "viem/chains"
import { isSolanaMainnetCluster } from "./solana-cluster"

let configured = false
let chainsLoadedPromise: Promise<void> | null = null
let solanaProvider: ReturnType<typeof Solana> | null = null
let evmProvider: ReturnType<typeof EVM> | null = null

type InjectedProviderRequest = {
  method: string
  params?: unknown[] | Record<string, unknown>
}

type InjectedProvider = {
  request(args: InjectedProviderRequest): Promise<unknown>
}

export type InjectedEvmWallet = {
  address: string
  chainId: number
}

const EVM_CHAINS = {
  [mainnet.id]: mainnet,
  [base.id]: base,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [polygon.id]: polygon,
} as const

export function initLifiConfig() {
  if (configured) return

  createConfig({
    integrator: "FundWise",
    disableVersionCheck: true,
    preloadChains: false,
  })

  configured = true
}

export async function ensureLifiChainsLoaded() {
  initLifiConfig()

  if (!chainsLoadedPromise) {
    chainsLoadedPromise = getChains({
      chainTypes: [ChainType.EVM, ChainType.SVM],
    })
      .then((chains) => {
        config.setChains(chains)
      })
      .catch((error) => {
        chainsLoadedPromise = null
        throw error
      })
  }

  return chainsLoadedPromise
}

function syncProviders() {
  config.setProviders(
    [solanaProvider, evmProvider].filter(Boolean) as NonNullable<
      typeof solanaProvider | typeof evmProvider
    >[]
  )
}

/**
 * Configure LI.FI SDK providers with Solana wallet adapter.
 * Call this from a React effect when the wallet connects.
 */
export function setLifiSolanaProvider(walletAdapter: SignerWalletAdapter | null) {
  initLifiConfig()

  if (!walletAdapter) {
    solanaProvider = null
    syncProviders()
    return
  }

  if (!solanaProvider) {
    solanaProvider = Solana({
      async getWalletAdapter() {
        return walletAdapter
      },
    })
  } else {
    solanaProvider.setOptions({
      async getWalletAdapter() {
        return walletAdapter
      },
    })
  }

  syncProviders()
}

/**
 * Configure LI.FI SDK with an EVM wallet (for users bridging FROM Ethereum/Base).
 * This is used when we detect the user has tokens on another chain.
 */
export function setLifiEvmProvider(wallet: InjectedEvmWallet | null) {
  initLifiConfig()

  if (!wallet) {
    evmProvider = null
    syncProviders()
    return
  }

  const getWalletClient = async (chainId: number = wallet.chainId) => {
    const provider = getInjectedProvider()
    if (!provider) {
      throw new Error("No injected EVM wallet found")
    }

    const chain = EVM_CHAINS[chainId as keyof typeof EVM_CHAINS]
    if (!chain) {
      throw new Error(`Unsupported EVM chain: ${chainId}`)
    }

    return createWalletClient({
      account: wallet.address as Address,
      chain,
      transport: custom(provider),
    })
  }

  const switchChain = async (chainId: number) => {
    const provider = getInjectedProvider()
    const chain = EVM_CHAINS[chainId as keyof typeof EVM_CHAINS]

    if (!provider || !chain) {
      throw new Error(`Unsupported EVM chain: ${chainId}`)
    }

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : `Failed to switch your EVM wallet to ${chain.name}`
      )
    }

    const refreshedWallet = await getInjectedEvmWallet()
    if (!refreshedWallet) {
      throw new Error("Failed to read the active EVM wallet after switching chains")
    }

    return getWalletClient(refreshedWallet.chainId)
  }

  if (!evmProvider) {
    evmProvider = EVM({
      getWalletClient: async () => getWalletClient(),
      switchChain,
    })
  } else {
    evmProvider.setOptions({
      getWalletClient: async () => getWalletClient(),
      switchChain,
    })
  }

  syncProviders()
}

function getInjectedProvider(): InjectedProvider | null {
  if (typeof window === "undefined") {
    return null
  }

  const injectedProvider = (window as Window & { ethereum?: InjectedProvider }).ethereum
  return injectedProvider || null
}

function normalizeWalletState(address: string | null, chainIdHex: string | null) {
  if (!address || !chainIdHex) {
    return null
  }

  return {
    address,
    chainId: Number.parseInt(chainIdHex, 16),
  }
}

export async function getInjectedEvmWallet(): Promise<InjectedEvmWallet | null> {
  const provider = getInjectedProvider()

  if (!provider) {
    return null
  }

  const [address] = ((await provider.request({
    method: "eth_accounts",
  })) as string[]) || []
  const chainIdHex = (await provider.request({
    method: "eth_chainId",
  })) as string | null

  return normalizeWalletState(address || null, chainIdHex)
}

export async function requestInjectedEvmWallet(): Promise<InjectedEvmWallet> {
  const provider = getInjectedProvider()

  if (!provider) {
    throw new Error("Install or unlock an injected EVM wallet such as MetaMask or Rabby")
  }

  const [address] = ((await provider.request({
    method: "eth_requestAccounts",
  })) as string[]) || []
  const chainIdHex = (await provider.request({
    method: "eth_chainId",
  })) as string | null
  const wallet = normalizeWalletState(address || null, chainIdHex)

  if (!wallet) {
    throw new Error("Failed to connect the injected EVM wallet")
  }

  return wallet
}

export function isLifiSupportedForCurrentCluster() {
  return isSolanaMainnetCluster()
}

// Supported chains for cross-chain bridge UI
export const LIFI_CHAINS = {
  SOLANA: 1151111081099710,
  ETHEREUM: 1,
  BASE: 8453,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
} as const

// USDC addresses on each chain
export const USDC_ADDRESSES: Record<number, string> = {
  [LIFI_CHAINS.SOLANA]: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // mainnet USDC
  [LIFI_CHAINS.ETHEREUM]: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  [LIFI_CHAINS.BASE]: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  [LIFI_CHAINS.ARBITRUM]: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  [LIFI_CHAINS.OPTIMISM]: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  [LIFI_CHAINS.POLYGON]: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
}

export const CHAIN_NAMES: Record<number, string> = {
  [LIFI_CHAINS.SOLANA]: "Solana",
  [LIFI_CHAINS.ETHEREUM]: "Ethereum",
  [LIFI_CHAINS.BASE]: "Base",
  [LIFI_CHAINS.ARBITRUM]: "Arbitrum",
  [LIFI_CHAINS.OPTIMISM]: "Optimism",
  [LIFI_CHAINS.POLYGON]: "Polygon",
}
