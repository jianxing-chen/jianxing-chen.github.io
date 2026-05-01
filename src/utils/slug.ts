/**
 * Extract slug from content collection ID.
 * Content collection IDs include language prefix (e.g., "en/hello-world"),
 * this function removes the prefix and returns the slug.
 */
export function extractSlug(id: string): string {
  return id.includes('/') ? id.split('/').slice(1).join('/') : id;
}
