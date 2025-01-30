// web/utils/injectStyles.ts
export const injectStylesToShadow = (element: HTMLElement | null, styles: string) => {
  if (!element) return;

  const shadowRoot = element.shadowRoot;
  if (shadowRoot) {
    // Prevent duplicate style injection
      if (!shadowRoot.querySelector("style[data-injected]")) {
      const styleTag = document.createElement("style");
      styleTag.setAttribute("data-injected", "true");
      styleTag.textContent = styles;
      shadowRoot.appendChild(styleTag);
      }
      // Recursively inject into nested shadow DOMs
      shadowRoot.querySelectorAll('*').forEach(child => {
          injectStylesToShadow(child as HTMLElement, styles);
      });
  } else {
    // Check if element is part of a Shadow DOM itself (for nested shadow doms)
     element.querySelectorAll('*').forEach(child => {
      injectStylesToShadow(child as HTMLElement, styles);
    });
  }
};