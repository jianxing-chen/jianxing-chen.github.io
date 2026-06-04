/**
 * Extract slug from content collection ID.
 * Content collection IDs include language prefix (e.g., "en/hello-world"),
 * this function removes the prefix and returns the slug.
 * Uses a regex replacement so it is robust even when the ID contains
 * multiple path segments (e.g. "en/sub/dir/post").
 */
export function extractSlug(id: string): string {
  return id.replace(/^[^/]+\//, '');
}
