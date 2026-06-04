export const SITE_CONFIG = {
  author: { en: 'Jianxing Chen', zh: '陈剑星' },
  position: { en: '“Liyun” Postdoctoral Fellow', zh: '励耘博士后' },
  affiliation: { en: 'School of Physics and Astronomy, Beijing Normal University', zh: '北京师范大学物理与天文学院' },
  selfPattern: 'Chen, J.',
  social: {
    github: 'https://github.com/jianxing-chen',
    orcid: 'https://orcid.org/0000-0002-8004-549X',
    ads: '#',
    email: 'mailto:jxchen_cn@outlook.com',
  },
  /** Cloudinary IDs for the homepage cover slideshow */
  coverPhotoIds: [
    'c1_DSC1418_tswqii',
    'DSC08917_ergsmw',
    'DSC02071_q8ozmv',
    'DSC07667_vh5stg',
    'DSC02388_rlk6od',
  ],
} as const;

export type Lang = 'en' | 'zh';
