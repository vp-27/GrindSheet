// The install manifest stays at a stable URL; only browser chrome follows the theme.
export function updateFavicon(isDark: boolean) {
  const favicon = document.getElementById(
    "dynamic-favicon",
  ) as HTMLLinkElement | null;
  if (favicon) favicon.href = isDark ? "/faviconDark.ico" : "/favicon.ico";
}
