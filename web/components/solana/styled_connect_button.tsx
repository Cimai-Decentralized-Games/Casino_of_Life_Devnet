// components/solana/styled_connect_button.tsx
import { useEffect, useCallback } from "react";
import { injectStylesToShadow } from "@/utils/injectStyles";
import styles from "@/styles/wallet-styles.css"; // Relative import path

export function StyledConnectButton() {
  const setButtonRef = useCallback((element: HTMLElement | null) => {
    if (element) {
      injectStylesToShadow(element, styles.toString()); // Inject the CSS content
    }
  }, []);

  useEffect(() => {
    const button = document.querySelector('appkit-button');
    if (button) {
      setButtonRef(button as HTMLElement);
    }
  }, [setButtonRef]);

  return <appkit-button />;
}