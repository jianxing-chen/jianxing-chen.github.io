/** 地点配置：name 名称 / lat, lng 主坐标 / timer7 七天预报网格点 */
export const LOCATION = {
  name: { en: 'Beijing', zh: '北京' },
  lat: 39.9,
  lng: 116.4,
  timer7: { lat: 39.96, lng: 116.36 },
} as const;

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
  /** 统一地点配置（时间/天气/日月出没等均引用此处，改地点只改这里） */
  location: LOCATION,
} as const;

export type Lang = 'en' | 'zh';
