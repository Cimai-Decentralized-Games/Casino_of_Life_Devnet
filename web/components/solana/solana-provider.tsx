// components/solana/solana-provider.tsx
'use client';
import { ReactNode } from "react";
import { WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

// Import config but don't reinitialize
import "../../config/appkit-config";

// Import the new styled button
import { StyledConnectButton } from "./styled_connect_button";

export function SolanaProvider({ children }: { children: ReactNode }) {
  const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

  return (
    <WalletProvider wallets={wallets} autoConnect>
      {children}
    </WalletProvider>
  );
}

// Export the styled button
export function ConnectWalletButton() {
  return <StyledConnectButton />;
}