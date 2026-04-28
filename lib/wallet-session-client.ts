"use client"

type SignMessageCapableWalletAdapter = {
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
}

function hasSignMessage(walletAdapter: unknown): walletAdapter is SignMessageCapableWalletAdapter {
  return (
    typeof walletAdapter === "object" &&
    walletAdapter !== null &&
    "signMessage" in walletAdapter &&
    typeof walletAdapter.signMessage === "function"
  )
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

async function getSessionStatus() {
  const response = await fetch("/api/auth/wallet/session", {
    method: "GET",
    cache: "no-store",
  })

  if (!response.ok) {
    return {
      authenticated: false,
      wallet: null as string | null,
    }
  }

  return response.json() as Promise<{ authenticated: boolean; wallet: string | null }>
}

export async function ensureWalletSession(params: {
  walletAddress: string
  walletAdapter?: unknown
}) {
  const { walletAddress, walletAdapter } = params

  if (!walletAddress) {
    throw new Error("Connect your wallet first")
  }

  const sessionStatus = await getSessionStatus()

  if (sessionStatus.authenticated && sessionStatus.wallet === walletAddress) {
    return
  }

  if (!hasSignMessage(walletAdapter)) {
    throw new Error("This wallet cannot sign FundWise verification messages.")
  }

  const challengeResponse = await fetch("/api/auth/wallet/challenge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ wallet: walletAddress }),
  })

  const challengeBody = (await challengeResponse.json()) as { message?: string; error?: string }

  if (!challengeResponse.ok || !challengeBody.message) {
    throw new Error(challengeBody.error || "Failed to start wallet verification.")
  }

  const signature = await walletAdapter.signMessage(
    new TextEncoder().encode(challengeBody.message)
  )

  const verifyResponse = await fetch("/api/auth/wallet/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wallet: walletAddress,
      signature: bytesToBase64(signature),
    }),
  })

  const verifyBody = (await verifyResponse.json()) as { error?: string }

  if (!verifyResponse.ok) {
    throw new Error(verifyBody.error || "FundWise wallet verification failed.")
  }
}
