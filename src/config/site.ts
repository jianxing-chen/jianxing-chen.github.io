export const SITE_CONFIG = {
  author: { en: 'Jianxing Chen', zh: '陈剑星' },
  position: { en: 'Postdoctoral Researcher', zh: '博士后研究员' },
  affiliation: { en: 'Department of Astronomy, Placeholder University', zh: '占位大学天文系' },
  selfPattern: 'Placeholder, A.',
  social: {
    github: '#',
    orcid: '#',
    ads: '#',
    email: 'mailto:placeholder@example.com',
  },
} as const;

export type Lang = 'en' | 'zh';
