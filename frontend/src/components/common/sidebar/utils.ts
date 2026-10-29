import { NAV_DATA, NavSectionData } from "./data";

/**
 * Checks if the current pathname matches the target href, or if the pathname is a subpath of the target href.
 */
export function isPathActive(href: string, pathname: string): boolean {
  if (!href) return false;

  if (["/", "/admin"].includes(href)) {
    return pathname === href;
  }

  if (href === "/revisor")
    return pathname === href || pathname.startsWith("/revisor/carpeta/");

  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Find the nav group whose child URLs include the current pathname.
 * Returns the group's `title` (used as the Disclosure `id`) or null.
 */
export function findActiveGroupKey(
  pathname: string,
  navData?: NavSectionData[],
): string | null {
  const sections = navData || NAV_DATA;

  for (const section of sections) {
    for (const item of section.items) {
      if (item.items && item.items.length > 0) {
        const hasMatch = item.items.some(
          (child) => child.url && isPathActive(child.url, pathname),
        );

        if (hasMatch) return item.title;
      }
    }
  }

  return null;
}
