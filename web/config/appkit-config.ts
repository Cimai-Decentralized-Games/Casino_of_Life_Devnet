// web/config/appkit-config.ts
import { createAppKit } from '@reown/appkit/react'
import { SolanaAdapter } from '@reown/appkit-adapter-solana/react'
import { solana, solanaTestnet, solanaDevnet } from '@reown/appkit/networks'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

// Initialize Solana Adapter
const solanaWeb3JsAdapter = new SolanaAdapter({
  wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
})

// Project configuration
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || '3a8652c9a4adf0c2746f3c24907aa68a'

// Metadata configuration
const metadata = {
  name: 'Reown Casino of Life',
  description: 'Train AI Agents to Play Games',
  url: 'https://cimai.biz',
  icons: ['https://public/logo.png'],
  allowedDomains: [
    'https://cimai.biz',
    'https://chat.cimai.biz'
  ]
}

// Initialize AppKit
createAppKit({
  adapters: [solanaWeb3JsAdapter],
  networks: [solana, solanaTestnet, solanaDevnet],
  defaultNetwork: solanaDevnet,
  metadata: metadata,
  projectId,
  features: {
    analytics: true,
    email: true, // default to true
    socials: ['google', 'x', 'discord', 'farcaster', 'github']
  },

  allWallets: 'HIDE', // default to SHOW

  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',       // Match Tailwind's default font
    '--w3m-accent': '#22c55e',                     // Matches Tailwind "primary" or DaisyUI accent
    '--w3m-color-mix': '#120e0b',                  // Tailwind's slate-800 for subtle highlights
    '--w3m-color-mix-strength': 30,                // Slight blending with base colors
    '--w3m-font-size-master': '12px',              // Match Tailwind's base font size
    '--w3m-border-radius-master': '12px',           // Matches Tailwind's rounded-lg
    '--w3m-z-index': 30                          // Tailwind's modal z-index
  },

  connectorImages: {
    phantom: 'https://cimai.biz/phantom.png',
    // walletConnect: 'https://images.mydapp.com/walletconnect.png'
  },


  tokens: {
    "solana:devnet": {
      address: '12h88aAZXUhYvWRCerKV2ebW5TqhVSFRc5s2TJNNiSmb',
      image: 'https://imgur.com/L40jn2Q' //optional
    },
  }
})