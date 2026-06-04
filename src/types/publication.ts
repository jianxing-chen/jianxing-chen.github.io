/** Publication metadata shared across components and pages. */
export interface Paper {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  volume: string;
  pages: string;
  doi: string;
  arxiv: string;
  ads: string;
  highlight: boolean;
  type: 'first-author' | 'co-author' | 'corresponding';
}
