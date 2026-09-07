/**
 * Resolves a public asset path against Vite's BASE_URL, so it works both
 * locally (base "/") and on a GitHub Pages project site (base "/Repo/"),
 * without any deployment-specific hardcoding. Never build a root-relative
 * "/..." path to a public asset directly — it silently breaks the moment
 * the site isn't served from the domain root.
 */
export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
