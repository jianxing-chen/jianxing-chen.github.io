export const SITE_CONFIG = {
  author: { en: 'Jianxing Chen', zh: '陈剑星' },
  position: { en: '"Liyun" Postdoctoral Fellow', zh: '励耘博士后' },
  affiliation: { en: 'School of Physics and Astronomy, Beijing Normal University', zh: '北京师范大学物理与天文学院' },
  selfPattern: 'Chen, J.',
  social: {
    github: 'https://github.com/jianxing-chen',
    orcid: 'https://orcid.org/0000-0002-8004-549X',
    ads: '#',
    email: 'mailto:jxchen_cn@outlook.com',
  },
} as const;

export type Lang = 'en' | 'zh';
