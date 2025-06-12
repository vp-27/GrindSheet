// Dynamic manifest utilities for theme-aware PWA support

interface ManifestData {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: string;
  background_color: string;
  theme_color: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

// Generate manifest data based on theme
export const generateManifest = (isDark: boolean): ManifestData => {
  const baseManifest: ManifestData = {
    name: "GrindSheet",
    short_name: "GrindSheet",
    description: "Competitive weight tracker app.",
    start_url: ".",
    display: "standalone",
    background_color: isDark ? "#000000" : "#f9fafb",
    theme_color: isDark ? "#000000" : "#f9fafb",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48 64x64 96x96 128x128 256x256",
        type: "image/x-icon"
      }
    ]
  };

  return baseManifest;
};

// Update the manifest link in the document head
export const updateManifestLink = (isDark: boolean) => {
  const manifestData = generateManifest(isDark);
  const manifestBlob = new Blob([JSON.stringify(manifestData, null, 2)], {
    type: 'application/json'
  });
  
  const manifestURL = URL.createObjectURL(manifestBlob);
  
  // Find existing manifest link or create new one
  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  
  if (manifestLink) {
    // Revoke old URL to prevent memory leaks
    if (manifestLink.href.startsWith('blob:')) {
      URL.revokeObjectURL(manifestLink.href);
    }
    manifestLink.href = manifestURL;
  } else {
    // Create new manifest link if it doesn't exist
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = manifestURL;
    document.head.appendChild(manifestLink);
  }
};

// Clean up blob URLs when component unmounts or theme changes
export const cleanupManifestURL = () => {
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  if (manifestLink && manifestLink.href.startsWith('blob:')) {
    URL.revokeObjectURL(manifestLink.href);
  }
};

// Dynamically update favicon based on theme
export const updateFavicon = (isDark: boolean) => {
  const faviconId = 'dynamic-favicon';
  let favicon = document.getElementById(faviconId) as HTMLLinkElement | null;
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.id = faviconId;
    document.head.appendChild(favicon);
  }
  favicon.href = isDark ? '/faviconDark.ico' : '/favicon.ico';
};
