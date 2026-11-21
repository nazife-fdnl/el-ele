// Hangi sayfaların koyu (afet anı) ve hangilerinin alt menülü (normal mod) olduğu.
const DARK = ['/afet-modu', '/fener', '/acil'];
const TABS = ['/', '/depremler', '/ogren', '/araclar', '/hakkinda'];

export function isDarkRoute(path: string | null): boolean {
  return !!path && DARK.some((p) => path === p || path.startsWith(`${p}/`));
}

export function isTabRoute(path: string | null): boolean {
  return !!path && TABS.includes(path);
}
