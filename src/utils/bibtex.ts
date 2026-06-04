import type { Paper } from '@/types/publication';

/** Generate a BibTeX citation key from the paper metadata. */
function makeCiteKey(paper: Paper): string {
  // Handle various author name formats: "LastName, FirstName", "FirstName LastName", "LastName"
  const rawFirstAuthor = (paper.authors[0] || 'Unknown');
  const firstAuthor = rawFirstAuthor
    .split(/[,;]/)[0]   // Take first segment before comma/semicolon
    .trim()
    .split(/\s+/)[0]     // Take first word (last name in most conventions)
    .replace(/[^a-zA-Z0-9]/g, '');
  const year = paper.year;
  const titleWord = paper.title.split(/[^a-zA-Z0-9]+/).filter(Boolean)[0] || 'article';
  return `${firstAuthor}${year}${titleWord}`;
}

/** Escape special LaTeX characters in a string. */
function latexEscape(s: string): string {
  return s
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, (c) => `\\${c}`)
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

/** Generate a BibTeX entry from a Paper object. */
export function generateBibTeX(paper: Paper): string {
  const key = makeCiteKey(paper);
  const authors = paper.authors.join(' and ');
  const title = latexEscape(paper.title);
  const journal = latexEscape(paper.journal);
  const doi = paper.doi;

  const fields: string[] = [
    `  author = {${authors}},\n`,
    `  title = {{${title}}},\n`,
    `  journal = {${journal}},\n`,
    `  year = {${paper.year}},\n`,
  ];

  if (paper.volume) fields.push(`  volume = {${paper.volume}},\n`);
  if (paper.pages) fields.push(`  pages = {${paper.pages}},\n`);
  if (doi) fields.push(`  doi = {${doi}},\n`);

  // Remove trailing comma from last field
  fields[fields.length - 1] = fields[fields.length - 1].replace(/,\n$/, '\n');

  return `@article{${key},\n${fields.join('')}}`;
}

/** Copy text to clipboard and return true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  }
}
