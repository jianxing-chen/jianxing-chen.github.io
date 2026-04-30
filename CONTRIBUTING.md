# 网站维护手册

## 1. 项目概述

本项目是一个**天文学科研个人学术网站**，采用以下技术栈：

- **框架**：Astro 6（静态站点生成，SSG）
- **样式**：Tailwind CSS v4（通过 `@tailwindcss/vite` 插件集成）
- **交互组件**：React 19（Astro Islands 架构，仅星表表格组件使用 React 客户端水合）
- **类型系统**：TypeScript
- **内容管理**：Astro Content Collections（Markdown / MDX）
- **数学公式**：KaTeX（通过 remark-math + rehype-katex）
- **部署**：GitHub Pages（GitHub Actions 自动构建部署）

### 核心架构说明

| 特性 | 说明 |
|------|------|
| 静态站点生成（SSG） | 所有页面在构建时预渲染为静态 HTML，无需服务端运行时 |
| Astro Islands | 默认零 JS，仅 `CatalogTable.tsx`（星表交互表格）使用 React 水合 |
| Content Collections | 博客、研究项目、星表说明通过 Markdown 文件管理，带 schema 校验 |
| 中英双语 | URL 前缀路由（`/en/`、`/zh/`），翻译 key 存储在 JSON 文件中 |
| 亮暗主题切换 | 基于 CSS 类名 `.dark`，通过 `localStorage` 持久化用户偏好 |

---

## 2. 项目目录结构

```
personal_web/
├── .astro/                          # Astro 自动生成的类型和缓存（勿手动修改）
├── .github/workflows/
│   └── deploy.yml                   # GitHub Actions 自动部署配置
├── .vscode/                         # VS Code 编辑器配置
├── dist/                            # 构建输出目录（勿手动修改）
├── node_modules/                    # npm 依赖（勿手动修改）
├── public/                          # 静态资源（构建时直接复制到输出目录）
│   ├── catalogs/                    # 星表 JSON 数据文件
│   │   └── variable-stars-catalog.json
│   ├── images/
│   │   ├── gallery/                 # 照片墙图片
│   │   │   ├── placeholder-1.svg … placeholder-6.svg
│   │   ├── research/                # 研究项目封面图
│   │   │   ├── placeholder-research-1.svg … placeholder-research-3.svg
│   │   └── og-default.svg           # Open Graph 默认分享图
│   ├── cv.pdf                       # 个人简历 PDF
│   ├── favicon.ico                  # 网站图标（ICO 格式）
│   └── favicon.svg                  # 网站图标（SVG 格式）
├── src/
│   ├── components/
│   │   ├── interactive/
│   │   │   └── CatalogTable.tsx     # 星表交互表格（React 组件，客户端水合）
│   │   ├── layout/
│   │   │   ├── BaseLayout.astro     # 全局页面布局（HTML head、字体、主题、分析）
│   │   │   ├── Footer.astro         # 页脚（版权信息、社交链接）
│   │   │   └── Header.astro         # 导航栏（导航链接、语言切换、主题切换）
│   │   └── ui/
│   │       ├── BlogPostCard.astro   # 博客文章卡片
│   │       ├── GalleryGrid.astro    # 照片墙网格
│   │       ├── LanguageSwitch.astro # 语言切换按钮
│   │       ├── ProjectCard.astro    # 研究项目卡片
│   │       ├── PublicationCard.astro # 论文卡片
│   │       └── ThemeToggle.astro    # 亮暗主题切换按钮
│   ├── content/                     # Content Collections 内容目录
│   │   ├── blog/
│   │   │   ├── en/                  # 英文博客文章
│   │   │   └── zh/                  # 中文博客文章
│   │   ├── catalogs/
│   │   │   ├── en/                  # 英文星表说明页
│   │   │   └── zh/                  # 中文星表说明页
│   │   ├── publications/
│   │   │   └── papers.json          # 论文列表数据
│   │   └── research/
│   │       ├── en/                  # 英文研究项目
│   │       └── zh/                  # 中文研究项目
│   ├── data/
│   │   └── gallery.json             # 照片墙数据
│   ├── i18n/
│   │   ├── en.json                  # 英文翻译
│   │   ├── zh.json                  # 中文翻译
│   │   └── ui.ts                    # i18n 工具函数
│   ├── pages/                       # 页面路由（文件即路由）
│   │   ├── en/                      # 英文页面
│   │   │   ├── blog/
│   │   │   │   ├── [slug].astro     # 博客文章详情页
│   │   │   │   └── index.astro      # 博客列表页
│   │   │   ├── catalogs/
│   │   │   │   ├── [slug].astro     # 星表详情页
│   │   │   │   └── index.astro      # 星表列表页
│   │   │   ├── research/
│   │   │   │   ├── [slug].astro     # 研究项目详情页
│   │   │   │   └── index.astro      # 研究项目列表页
│   │   │   ├── about.astro          # 关于页
│   │   │   ├── gallery.astro        # 照片墙页
│   │   │   ├── index.astro          # 英文首页
│   │   │   └── publications.astro   # 论文列表页
│   │   ├── zh/                      # 中文页面（结构同 en/）
│   │   │   ├── blog/
│   │   │   ├── catalogs/
│   │   │   ├── research/
│   │   │   ├── about.astro
│   │   │   ├── gallery.astro
│   │   │   ├── index.astro
│   │   │   └── publications.astro
│   │   └── index.astro              # 根路径重定向页
│   ├── styles/
│   │   └── global.css               # 全局样式（主题变量、配色、排版）
│   ├── utils/                       # 工具函数目录
│   └── content.config.ts            # Content Collections schema 定义
├── .env                             # 环境变量（本地使用，不提交到 Git）
├── .env.example                     # 环境变量示例
├── astro.config.mjs                 # Astro 项目配置
├── package.json                     # 项目依赖与脚本
├── package-lock.json                # 依赖锁文件
└── tsconfig.json                    # TypeScript 配置
```

---

## 3. 本地开发

### 3.1 环境要求

| 依赖 | 版本要求 |
|------|---------|
| Node.js | `>= 22.12.0`（在 `package.json` 的 `engines` 字段中指定） |
| npm | 随 Node.js 附带即可 |

### 3.2 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器（带热更新）
npm run dev

# 生产构建（输出到 dist/ 目录）
npm run build

# 预览生产构建结果
npm run preview
```

### 3.3 环境变量配置

将 `.env.example` 复制为 `.env`，按需填入实际值：

```bash
cp .env.example .env
```

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PUBLIC_UMAMI_WEBSITE_ID` | Umami 统计的 Website ID | `your-website-id-here` |
| `PUBLIC_UMAMI_SCRIPT_URL` | Umami 统计脚本 URL | `https://cloud.umami.is/script.js` |

> **注意**：以 `PUBLIC_` 开头的变量会暴露到客户端代码中。如果不需要访问统计，留空即可——代码中会判断 `PUBLIC_UMAMI_WEBSITE_ID` 为空时不注入统计脚本。

---

## 4. 内容管理

### 4.1 个人信息修改

个人信息分散在多个文件中，修改时需确保中英文版本同步更新：

#### 首页 Hero 区域

| 信息项 | 英文文件 | 中文文件 |
|--------|---------|---------|
| 姓名 | `src/pages/en/index.astro` 第 57 行 `<h1>` 标签内 | `src/pages/zh/index.astro` 第 57 行 `<h1>` 标签内 |
| 职称 | `src/pages/en/index.astro` 第 59–61 行 `<p>` 标签内 | `src/pages/zh/index.astro` 第 59–61 行 `<p>` 标签内 |
| 单位 | `src/pages/en/index.astro` 第 62–64 行 `<p>` 标签内 | `src/pages/zh/index.astro` 第 62–64 行 `<p>` 标签内 |
| 个人简介标语 | `src/i18n/en.json` → `home.hero_tagline` | `src/i18n/zh.json` → `home.hero_tagline` |
| 个人简介描述 | `src/i18n/en.json` → `home.hero_description` | `src/i18n/zh.json` → `home.hero_description` |
| 头像图片 | `public/images/avatar.jpg`（替换此文件即可，中英文共用） | 同左 |
| 社交链接（GitHub、ORCID、ADS、Email） | `src/pages/en/index.astro` 第 74–93 行 `<a>` 标签的 `href` | `src/pages/zh/index.astro` 第 74–93 行 |

#### About 页面

| 信息项 | 英文文件 | 中文文件 |
|--------|---------|---------|
| 姓名、职称、单位 | `src/pages/en/about.astro` 第 82–89 行 | `src/pages/zh/about.astro` 第 82–89 行 |
| 研究兴趣标签 | `src/pages/en/about.astro` `researchInterests` 数组 | `src/pages/zh/about.astro` `researchInterests` 数组 |
| 教育经历 | `src/pages/en/about.astro` `education` 数组 | `src/pages/zh/about.astro` `education` 数组 |
| 工作经历 | `src/pages/en/about.astro` `experience` 数组 | `src/pages/zh/about.astro` `experience` 数组 |
| 获奖荣誉 | `src/pages/en/about.astro` `awards` 数组 | `src/pages/zh/about.astro` `awards` 数组 |
| 联系方式（Email、地址、GitHub、ORCID） | `src/pages/en/about.astro` Contact 区域（第 175–209 行） | `src/pages/zh/about.astro` Contact 区域 |

#### Footer 版权信息

修改 i18n 翻译文件中的对应 key：

- `src/i18n/en.json` → `"footer.copyright": "© 2024 Placeholder Name. All rights reserved."`
- `src/i18n/zh.json` → `"footer.copyright": "© 2024 Placeholder Name. 保留所有权利。"`

#### Footer 社交链接

在 `src/components/layout/Footer.astro` 中直接修改 `<a>` 标签的 `href` 属性（第 23–76 行），包括 GitHub、ORCID、ADS、Email 四个链接。

#### 网站标题

- `src/i18n/en.json` → `"site.title": "Astro Scholar"`
- `src/i18n/zh.json` → `"site.title": "Astro Scholar"`

#### Header Logo 文字

`src/components/layout/Header.astro` 第 41 行，直接修改 `<a>` 标签内的文字 `Astro Scholar`。

### 4.2 论文列表管理

**数据文件**：`src/content/publications/papers.json`

#### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | 是 | 论文标题 |
| `authors` | string[] | 是 | 作者列表，格式为 `"姓, 名缩写."` |
| `journal` | string | 是 | 期刊缩写（如 `ApJ`、`MNRAS`、`A&A`） |
| `year` | number | 是 | 发表年份 |
| `volume` | string | 是 | 卷号 |
| `pages` | string | 是 | 页码（如 `"112"` 或 `"3458-3475"`） |
| `doi` | string | 是 | DOI 编号（不含 `https://doi.org/` 前缀） |
| `arxiv` | string | 是 | arXiv 编号 |
| `ads` | string | 是 | ADS Bibcode |
| `highlight` | boolean | 是 | 是否高亮显示（首页展示时优先） |
| `type` | string | 是 | 作者类型：`"first-author"` / `"co-author"` / `"corresponding"` |

#### 作者名加粗规则

在 `src/components/ui/PublicationCard.astro` 中，`selfPattern` 变量（第 27 行）定义了需要高亮显示的作者名：

```typescript
const selfPattern = 'Placeholder, A.';
```

**修改方法**：将 `'Placeholder, A.'` 替换为你的实际姓名格式。`authors` 数组中与此值完全匹配的作者名会以主题色加粗显示。

#### 添加新论文示例

在 `papers.json` 数组开头添加新条目（最新的论文放在数组最前面，首页取前 3 篇展示）：

```json
{
  "title": "Your Paper Title Here",
  "authors": ["YourName, X.", "Coauthor, Y.", "Coauthor, Z."],
  "journal": "ApJ",
  "year": 2025,
  "volume": "970",
  "pages": "42",
  "doi": "10.3847/1538-4357/xxxx",
  "arxiv": "2025.12345",
  "ads": "2025ApJ...970...42Y",
  "highlight": true,
  "type": "first-author"
}
```

### 4.3 博客文章管理

#### 文件路径规则

```
src/content/blog/
├── en/
│   └── 文章标识名.md     # 英文版
└── zh/
    └── 文章标识名.md     # 中文版（文件名必须与英文版一致）
```

#### Frontmatter 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `title` | string | 是 | — | 文章标题 |
| `date` | date | 是 | — | 发布日期，格式 `YYYY-MM-DD` |
| `tags` | string[] | 是 | — | 标签数组 |
| `description` | string | 是 | — | 文章摘要描述 |
| `cover` | string | 否 | — | 封面图路径 |
| `lang` | `"en"` \| `"zh"` | 是 | — | 文章语言标识 |
| `draft` | boolean | 否 | `false` | 设为 `true` 时文章不会在列表中显示 |

#### Frontmatter 示例

```yaml
---
title: "Exploring the Cosmos: An Introduction to Modern Spectroscopy"
date: 2024-06-15
tags: ["spectroscopy", "tutorial", "astrophysics"]
description: "A brief introduction to modern spectroscopic techniques used in astronomical research."
lang: en
---
```

#### KaTeX 数学公式

本项目通过 `remark-math` + `rehype-katex` 插件支持 LaTeX 数学公式：

- **行内公式**：使用 `$...$`，例如 `$v_r = c \cdot \Delta\lambda / \lambda_0$`
- **块级公式**：使用 `$$...$$`，例如：

```markdown
$$
L = 4\pi R^2 \sigma T^4
$$
```

#### 代码块语法高亮

使用三个反引号加语言标识：

````markdown
```python
import numpy as np
print("Hello, Astronomy!")
```
````

#### 草稿模式

在 frontmatter 中设置 `draft: true`，文章将在构建时被排除，不会出现在博客列表和首页中。

### 4.4 照片墙管理

**数据文件**：`src/data/gallery.json`

**图片文件放置目录**：`public/images/gallery/`

#### JSON 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 唯一标识符（英文，短横线分隔） |
| `src` | string | 是 | 原图路径，以 `/` 开头（网站根路径） |
| `thumbnail` | string | 是 | 缩略图路径，以 `/` 开头（网站根路径） |
| `title` | `{ en: string, zh: string }` | 是 | 中英文标题 |
| `description` | `{ en: string, zh: string }` | 是 | 中英文描述 |
| `date` | string | 是 | 拍摄日期，格式 `YYYY-MM-DD` |
| `tags` | string[] | 是 | 标签数组 |
| `width` | number | 是 | 图片宽度（像素） |
| `height` | number | 是 | 图片高度（像素） |
| `featured` | boolean | 是 | 设为 `true` 时在首页「精选照片」区域展示 |

#### 图片路径规则

本项目采用 GitHub Pages **用户站点**（仓库名为 `jianxing86.github.io`）部署，`base` 为 `/`，因此所有图片路径直接以 `/` 开头即可：

```
/images/gallery/你的图片文件名.jpg
```

对应的物理文件放置在：

```
public/images/gallery/你的图片文件名.jpg
```

#### 添加新照片示例

1. 将图片文件放入 `public/images/gallery/` 目录
2. 在 `src/data/gallery.json` 数组中添加新条目：

```json
{
  "id": "your-photo-id",
  "src": "/images/gallery/your-photo.jpg",
  "thumbnail": "/images/gallery/your-photo.jpg",
  "title": { "en": "English Title", "zh": "中文标题" },
  "description": { "en": "English description", "zh": "中文描述" },
  "date": "2025-01-01",
  "tags": ["nebula", "deep-sky"],
  "width": 1200,
  "height": 800,
  "featured": true
}
```

### 4.5 研究项目管理

**文件路径**：`src/content/research/{en|zh}/项目标识名.md`

中英文版本必须使用相同的文件名。

#### Frontmatter 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `title` | string | 是 | — | 项目标题 |
| `status` | `"ongoing"` \| `"completed"` | 是 | — | 项目状态 |
| `description` | string | 是 | — | 项目简要描述 |
| `cover` | string | 否 | — | 封面图路径（以 `/` 开头，指向 `public/` 下的资源） |
| `tags` | string[] | 是 | — | 标签数组 |
| `order` | number | 否 | `0` | 排序值，**数字越小排越前** |

#### Frontmatter 示例

```yaml
---
title: "Large-scale Stellar Spectroscopic Survey"
status: "ongoing"
description: "A comprehensive spectroscopic survey targeting variable stars in the Galactic bulge."
cover: "/images/research/placeholder-research-1.svg"
tags: ["spectroscopy", "survey", "variable-stars"]
order: 1
---
```

#### 封面图放置位置

将封面图放入 `public/images/research/` 目录，路径格式：

```
/images/research/你的封面图.jpg
```

### 4.6 星表数据管理

#### 文件结构

每个星表由两部分组成：

1. **说明文件**（Markdown）：`src/content/catalogs/{en|zh}/星表标识名.md`
2. **数据文件**（JSON）：`public/catalogs/星表数据文件名.json`

#### Frontmatter 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `title` | string | 是 | — | 星表标题 |
| `description` | string | 是 | — | 星表描述 |
| `version` | string | 否 | — | 版本号 |
| `rows` | number | 否 | — | 数据行数 |
| `dataFile` | string | 是 | — | 数据 JSON 文件路径（以 `/` 开头，指向 `public/catalogs/` 下的 JSON） |
| `columns` | array | 是 | — | 列定义数组（见下方说明） |
| `citation` | string | 否 | — | 引用文本 |
| `doi` | string | 否 | — | DOI 编号 |

#### columns 数组格式

`columns` 是一个对象数组，每个对象定义表格中的一列：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `key` | string | 是 | — | 对应 JSON 数据中的字段名 |
| `label` | string | 是 | — | 表头显示文字 |
| `type` | `"string"` \| `"number"` \| `"ra"` \| `"dec"` | 否 | `"string"` | 数据类型（`ra`/`dec` 会格式化为天球坐标） |

#### Frontmatter 示例

```yaml
---
title: "Variable Stars Catalog in the Galactic Bulge"
description: "A catalog of variable stars identified from multi-epoch spectroscopic observations."
version: "1.0"
rows: 50
dataFile: "/catalogs/variable-stars-catalog.json"
columns:
  - { key: "id", label: "ID", type: "string" }
  - { key: "name", label: "Name", type: "string" }
  - { key: "ra", label: "RA (J2000)", type: "ra" }
  - { key: "dec", label: "Dec (J2000)", type: "dec" }
  - { key: "magnitude", label: "V mag", type: "number" }
  - { key: "period", label: "Period (d)", type: "number" }
  - { key: "type", label: "Var. Type", type: "string" }
  - { key: "metallicity", label: "[Fe/H]", type: "number" }
  - { key: "distance_kpc", label: "Dist (kpc)", type: "number" }
citation: "Placeholder et al. (2024), ApJ, 965, 112"
doi: "10.3847/1538-4357/xxxx"
---
```

#### 添加新星表完整步骤

**第 1 步：准备数据文件**

将星表 JSON 数据文件放入 `public/catalogs/` 目录。数据格式为对象数组，每个对象代表一行数据：

```json
[
  { "id": "001", "name": "STAR-001", "ra": 267.123, "dec": -28.456, "magnitude": 14.5 },
  { "id": "002", "name": "STAR-002", "ra": 268.789, "dec": -29.012, "magnitude": 15.2 }
]
```

**第 2 步：创建英文说明页**

创建文件 `src/content/catalogs/en/你的星表名.md`，填写 frontmatter 和正文描述。确保 `dataFile` 路径指向第 1 步的 JSON 文件，`columns` 数组中的 `key` 与 JSON 数据的字段名对应。

**第 3 步：创建中文说明页**

创建文件 `src/content/catalogs/zh/你的星表名.md`（文件名必须与英文版一致），填写中文版 frontmatter 和正文。`dataFile` 和 `columns` 与英文版保持一致。

**第 4 步：验证**

```bash
npm run dev
```

访问 `http://localhost:4321/en/catalogs/你的星表名/` 和 `http://localhost:4321/zh/catalogs/你的星表名/` 检查表格是否正常加载。

---

## 5. 多语言 (i18n) 管理

### 5.1 翻译文件路径

- 英文：`src/i18n/en.json`
- 中文：`src/i18n/zh.json`

### 5.2 Key 命名规则

翻译 key 按页面/模块分类，使用 `.` 分隔的命名空间：

| 前缀 | 用途 | 示例 key |
|------|------|----------|
| `nav.*` | 导航栏链接 | `nav.home`、`nav.about`、`nav.publications`、`nav.blog`、`nav.gallery`、`nav.research`、`nav.catalogs` |
| `site.*` | 网站全局信息 | `site.title`、`site.description` |
| `footer.*` | 页脚 | `footer.copyright`、`footer.powered_by` |
| `about.*` | 关于页 | `about.title`、`about.research_interests`、`about.education`、`about.experience`、`about.awards`、`about.contact`、`about.download_cv`、`about.office_address` |
| `common.*` | 通用 UI 文案 | `common.read_more`、`common.view_all`、`common.back`、`common.search`、`common.filter` |
| `theme.*` | 主题切换 | `theme.light`、`theme.dark` |
| `home.*` | 首页 | `home.welcome`、`home.description`、`home.hero_tagline`、`home.hero_description`、`home.recent_publications`、`home.latest_posts`、`home.photo_highlights`、`home.view_all`、`home.explore`、`home.quick_about`、`home.quick_publications`、`home.quick_blog`、`home.quick_research`、`home.quick_catalogs`、`home.quick_gallery` |
| `publications.*` | 论文页 | `publications.title`、`publications.total`、`publications.first_author`、`publications.ads`、`publications.arxiv`、`publications.doi`、`publications.pdf`、`publications.all`、`publications.filter_first_author`、`publications.corresponding` |
| `research.*` | 研究页 | `research.title`、`research.description`、`research.ongoing`、`research.completed`、`research.all`、`research.related_papers`、`research.back_to_list` |
| `gallery.*` | 照片墙 | `gallery.title`、`gallery.description`、`gallery.view_full`、`gallery.photo_count` |
| `blog.*` | 博客 | `blog.title`、`blog.all_posts`、`blog.tags`、`blog.read_more`、`blog.toc`、`blog.prev_post`、`blog.next_post`、`blog.published_on`、`blog.minutes_read` |
| `catalogs.*` | 星表 | `catalogs.title`、`catalogs.description`、`catalogs.rows`、`catalogs.version`、`catalogs.download`、`catalogs.search_placeholder`、`catalogs.showing`、`catalogs.of`、`catalogs.citation`、`catalogs.doi` |

### 5.3 两个文件必须同步

`en.json` 和 `zh.json` 中的 key 必须完全一致。添加新 key 时，务必在两个文件中同时添加。

### 5.4 工具函数说明

工具函数定义在 `src/i18n/ui.ts` 中：

| 函数 | 签名 | 说明 |
|------|------|------|
| `getLangFromUrl` | `(url: URL) => string` | 从 URL 路径中提取语言标识（`en` 或 `zh`），自动处理 base path 前缀 |
| `useTranslations` | `(lang: string) => (key: string) => string` | 返回翻译函数 `t(key)`，找不到翻译时回退到英文，再找不到返回 key 本身 |
| `getLocalizedPath` | `(path: string, lang: string) => string` | 生成带语言前缀和 base path 的完整路径，如 `getLocalizedPath('/about', 'zh')` → `'/zh/about'`（用户站点 `base: '/'` 下） |

#### 在 Astro 组件中使用示例

```astro
---
import { useTranslations, getLocalizedPath } from '@/i18n/ui';

const lang = 'zh';
const t = useTranslations(lang);
---

<h1>{t('site.title')}</h1>
<a href={getLocalizedPath('/about', lang)}>
  {t('nav.about')}
</a>
```

---

## 6. 主题与样式

### 6.1 全局样式文件

`src/styles/global.css`

### 6.2 配色方案

| CSS 变量 | 亮色模式值 | 暗色模式值 | 用途 |
|----------|-----------|-----------|------|
| `--color-primary-light` | `#2563EB` | — | 主色调（亮色） |
| `--color-primary-dark` | — | `#60A5FA` | 主色调（暗色） |
| `--color-accent-light` | `#D97706` | — | 强调色（亮色） |
| `--color-accent-dark` | — | `#FBBF24` | 强调色（暗色） |
| `--color-background-light` | `#FAFAFA` | — | 背景色（亮色） |
| `--color-background-dark` | — | `#0F172A` | 背景色（暗色） |
| `--color-text-light` | `#334155` | — | 正文颜色（亮色） |
| `--color-text-dark` | — | `#E2E8F0` | 正文颜色（暗色） |
| `--color-heading-light` | `#0F172A` | — | 标题颜色（亮色） |
| `--color-heading-dark` | — | `#F8FAFC` | 标题颜色（暗色） |

### 6.3 字体配置

| CSS 变量 | 值 | 用途 |
|----------|----|------|
| `--font-sans` | `'Inter', 'Noto Sans SC', ui-sans-serif, system-ui, sans-serif` | 正文字体（Inter 用于英文，Noto Sans SC 用于中文） |
| `--font-heading` | `'Space Grotesk', 'Inter', sans-serif` | 标题字体 |
| `--font-mono` | `'JetBrains Mono', ui-monospace, monospace` | 代码字体 |

字体通过 Google Fonts CDN 加载（在 `BaseLayout.astro` 中引入）。

### 6.4 如何修改主色调

编辑 `src/styles/global.css` 中 `@theme` 块内的 CSS 变量：

```css
@theme {
  --color-primary-light: #你的亮色主色;
  --color-primary-dark: #你的暗色主色;
  /* ... 其他变量 ... */
}
```

修改后，所有使用 Tailwind 类名 `text-primary-light`、`bg-primary-light` 等的元素会自动更新。

### 6.5 暗色模式原理

1. **初始化**：在 `BaseLayout.astro` 的 `<head>` 中有一段内联脚本，在页面渲染前读取 `localStorage` 中的 `theme` 值，或跟随系统偏好，决定是否为 `<html>` 添加 `dark` 类
2. **切换**：`ThemeToggle.astro` 组件切换 `<html>` 上的 `dark` 类并保存到 `localStorage`
3. **样式**：全局使用 Tailwind 的 `dark:` 前缀变体应用暗色样式，自定义变体定义在 `global.css` 中：`@custom-variant dark (&:where(.dark, .dark *));`

---

## 7. 布局与导航

### 7.1 BaseLayout.astro Props

`src/components/layout/BaseLayout.astro` 是所有页面的基础布局组件：

| Prop | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `title` | string | 是 | — | 页面 `<title>` 和 OG 标题 |
| `description` | string | 否 | `'Personal academic website built with Astro'` | 页面描述（SEO / OG） |
| `lang` | string | 否 | `'en'` | 页面语言（`'en'` 或 `'zh'`） |
| `ogImage` | string | 否 | `public/images/og-default.svg` | Open Graph 分享图 URL |

### 7.2 如何增减导航链接

编辑 `src/components/layout/Header.astro` 中的 `navItems` 数组（第 13–21 行）：

```typescript
const navItems = [
  { key: 'nav.home', path: '/' },
  { key: 'nav.about', path: '/about/' },
  { key: 'nav.publications', path: '/publications/' },
  { key: 'nav.blog', path: '/blog/' },
  { key: 'nav.gallery', path: '/gallery/' },
  { key: 'nav.research', path: '/research/' },
  { key: 'nav.catalogs', path: '/catalogs/' },
];
```

- **添加导航项**：在数组中添加新对象，`key` 为 i18n 翻译 key，`path` 为相对路径（不含语言前缀和 base path）
- **删除导航项**：从数组中移除对应对象
- **调整顺序**：改变数组中对象的顺序

> **注意**：添加新导航项时，需在 `en.json` 和 `zh.json` 中添加对应的 `nav.*` 翻译 key。

### 7.3 如何修改 Footer 社交链接

编辑 `src/components/layout/Footer.astro` 中的社交链接区域（第 21–77 行）。每个链接是一个 `<a>` 标签，修改 `href` 属性即可：

- **GitHub**：第 24 行 `href="#"` → 替换为你的 GitHub 主页 URL
- **ORCID**：第 38 行 `href="#"` → 替换为你的 ORCID 页面 URL
- **ADS**：第 52 行 `href="#"` → 替换为你的 ADS 库页面 URL
- **Email**：第 66 行 `href="mailto:placeholder@example.com"` → 替换为你的邮箱

### 7.4 如何修改网站名称/Logo

Header 左上角的 Logo 文字在 `src/components/layout/Header.astro` 第 41 行：

```html
Astro Scholar
```

直接修改此文本即可。Logo 使用的字体为 `Space Grotesk`。

---

## 8. 部署

### 8.1 GitHub Pages 自动部署流程

项目使用 GitHub Actions 自动部署，流程如下：

1. 推送代码到 `main` 分支（或手动触发 workflow）
2. GitHub Actions 自动运行：检出代码 → 安装 Node.js 22 → `npm ci` → `npm run build`
3. 构建产物（`dist/` 目录）上传为 GitHub Pages artifact
4. 自动部署到 GitHub Pages

### 8.2 deploy.yml 关键配置

| 配置项 | 值 | 说明 |
|--------|------|------|
| 触发条件 | `push` 到 `main` 分支，或 `workflow_dispatch` | 自动/手动触发 |
| Node 版本 | `22` | 与 `package.json` 的 `engines` 要求一致 |
| 构建命令 | `npm run build` | 生产构建 |
| 部署方式 | `actions/deploy-pages@v4` | 部署到 GitHub Pages |
| 并发控制 | `cancel-in-progress: false` | 不取消正在进行的部署 |

### 8.3 如何修改 site 和 base URL

本项目采用用户站点部署模式（仓库名 = `jianxing86.github.io`），编辑 `astro.config.mjs`：

```javascript
export default defineConfig({
  site: 'https://jianxing86.github.io',  // 用户站点根域名
  base: '/',                             // 用户站点根部署，无子路径；此行也可省略（默认为 '/'）
  // ...
});
```

> **注意**：若将来改为**项目站点**（即仓库名不是 `<username>.github.io`），需将 `base` 改为 `/仓库名/`，并同步更新所有硬编码资源路径（`gallery.json`、研究封面、星表 `dataFile` 等）的 `/` 前缀。

### 8.4 GitHub Secrets 配置

在 GitHub 仓库的 **Settings → Secrets and variables → Actions** 中配置以下 Secrets（可选）：

| Secret 名称 | 说明 |
|-------------|------|
| `UMAMI_WEBSITE_ID` | Umami 统计的 Website ID |
| `UMAMI_SCRIPT_URL` | Umami 统计脚本 URL（不设置则使用默认值 `https://cloud.umami.is/script.js`） |

### 8.5 从零部署到 GitHub Pages 完整教程

以下 9 个步骤将指导你从创建仓库到网站上线的完整流程。

#### 第 1 步：创建 GitHub 仓库（用户站点）

1. 登录 [GitHub](https://github.com/)，点击右上角 **"+"** → **"New repository"**
2. **仓库名必须严格填写为** `jianxing86.github.io`（格式为 `<用户名>.github.io`，本项目用户名为 `jianxing86`）
   - 这种命名是 GitHub Pages 的**用户站点（User Site）**约定，网站将部署到根域名 `https://jianxing86.github.io/`（**无子路径**）
   - 每个 GitHub 账号只能有 1 个用户站点仓库
3. 选择 **Public**，**不勾选** "Add a README"（因为本地已有）
4. 点击 **"Create repository"**

#### 第 2 步：初始化本地 Git 并关联远程仓库

```bash
cd /path/to/personal_web
git init
git add .
git commit -m "Initial commit: personal academic website"
git branch -M main
git remote add origin https://github.com/jianxing86/jianxing86.github.io.git
git push -u origin main
```

> **提示**：如果你已经在本地有 Git 仓库，只需执行最后两行关联远程仓库并推送即可。

#### 第 3 步：配置 GitHub Pages 源

1. 进入仓库页面 → **Settings** → 左侧菜单 **Pages**
2. "Build and deployment" 下的 "Source" 选择 **"GitHub Actions"**
3. 保存后无需其他操作

> **重要**：不要选择 "Deploy from a branch"，因为本项目使用 GitHub Actions 构建部署（见 `.github/workflows/deploy.yml`）。

#### 第 4 步：配置访问统计 Secrets（可选）

1. 进入仓库 **Settings** → **Secrets and variables** → **Actions**
2. 点击 **"New repository secret"**
3. 分别添加以下两个 Secret：

| Name | Value |
|------|-------|
| `UMAMI_WEBSITE_ID` | 你的 Umami Website ID |
| `UMAMI_SCRIPT_URL` | `https://cloud.umami.is/script.js` |

> 如果暂不需要统计功能，可跳过此步。`deploy.yml` 中会通过 `${{ secrets.UMAMI_WEBSITE_ID }}` 和 `${{ secrets.UMAMI_SCRIPT_URL }}` 注入这些值，为空时不影响构建。

#### 第 5 步：修改 site 和 base 配置

> ✅ **本仓库已完成此配置。** 当前 `astro.config.mjs` 中 `site: 'https://jianxing86.github.io'`、`base: '/'`，所有资源路径均以 `/` 开头。若你 fork 或直接 clone 本仓库部署到 `jianxing86.github.io`，本步骤**无需任何改动**，可直接跳到第 6 步。以下清单保留作为：① 审计当前仓库状态；② 未来若需改用项目站点方案（仓库名非 `<username>.github.io`）时的**逆向切换参考**。

编辑 `astro.config.mjs`，将 `site` 改为用户站点域名，`base` 改为 `/`：

```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://jianxing86.github.io',   // 用户站点根域名
  base: '/',                              // 用户站点根部署，保持 '/'（或直接删除此行）
  // ... 其他配置保持不变
});
```

**重要提醒**：采用用户站点方案后，项目中所有资源路径均以 `/` 开头（如 `/images/...`、`/catalogs/...`），无需额外的 `/仓库名/` 前缀。以下是切换到方案 1 时**所有受影响的文件清单**（精确到行号与改动前后对比，表格左列 = 项目站点方案旧值，右列 = 用户站点方案现值 / 本仓库当前值）。

##### ① 配置类（1 个文件）

| 文件 | 行号 | 项目站点旧值 | 用户站点现值（当前） |
|------|------|---------|---------|
| `astro.config.mjs` | L11 | `site: 'https://USERNAME.github.io'` | `site: 'https://jianxing86.github.io'` |
| `astro.config.mjs` | L12 | `base: '/personal_web'` | `base: '/'`（或删除此行） |

##### ② 数据文件（1 个文件，12 处路径）

| 文件 | 修改说明 |
|------|---------|
| `src/data/gallery.json` | 6 张图片的 `src` + `thumbnail` 兼 12 处，所在行：L4-L5、L16-L17、L28-L29、L40-L41、L52-L53、L64-L65 |

统一规则：`/personal_web/images/gallery/...` → `/images/gallery/...`

##### ③ 内容集合 Markdown（8 个文件，各 1 处 frontmatter）

| 文件 | 行号 | 字段 |
|------|------|------|
| `src/content/research/en/stellar-spectroscopy.md` | L5 | `cover` |
| `src/content/research/zh/stellar-spectroscopy.md` | L5 | `cover` |
| `src/content/research/en/stellar-catalog.md` | L5 | `cover` |
| `src/content/research/zh/stellar-catalog.md` | L5 | `cover` |
| `src/content/research/en/data-driven-methods.md` | L5 | `cover` |
| `src/content/research/zh/data-driven-methods.md` | L5 | `cover` |
| `src/content/catalogs/en/variable-stars.md` | L6 | `dataFile` |
| `src/content/catalogs/zh/variable-stars.md` | L6 | `dataFile` |

统一规则：`/personal_web/...` → `/...`

##### ④ 页面 / 逻辑代码（3 个文件）

| 文件 | 行号 | 项目站点旧值 | 用户站点现值（当前） |
|------|------|------|------|
| `src/pages/index.astro` | L2 | `Astro.redirect('/personal_web/en/')` | `Astro.redirect('/en/')` |
| `src/pages/en/catalogs/[slug].astro` | L28 | `dataUrl.replace('/personal_web/', '')` | `dataUrl.replace(import.meta.env.BASE_URL, '').replace(/^\//, '')` |
| `src/pages/zh/catalogs/[slug].astro` | L28 | 同上 | 同上 |

> **说明**：`[slug].astro` 的新实现使用 `import.meta.env.BASE_URL` 动态削去前缀，无论未来 base 改为任何值均可适配，无需再改此行。

##### ⑤ 工具函数注释（1 个文件，仅注释同步）

| 文件 | 行号 | 项目站点旧注释 | 用户站点现注释（当前） |
|------|------|---------|------|
| `src/i18n/ui.ts` | L15 | `/personal_web/en/about → "en"` | `/en/about → "en"` |
| `src/i18n/ui.ts` | L41 | `getLocalizedPath('/about', 'zh') → '/personal_web/zh/about'` | `→ '/zh/about'` |

##### ⑥ 无需修改（已使用 base 变量或无硬编码）

| 文件 | 行号 | 说明 |
|------|------|------|
| `src/pages/en/about.astro` | L215 | CV 链接已使用 `${base}/cv.pdf`，`base` 为 `/` 时自动生效 |
| `src/pages/zh/about.astro` | L214 | 同上 |
| `.github/workflows/deploy.yml` | 全文 | 无硬编码 base 路径，无需改动 |

##### ⑦ 构建产物（下次构建自动重生成）

`dist/` 目录下所有内容会在每次 `npm run build` 时按当前 `base` 重新生成，**无需手动修改**。

##### ⑧ 逆向切换（用户站点 → 项目站点）快速脚本

若未来改为项目站点部署（仓库名非 `<username>.github.io`），可反向操作。以 macOS / BSD sed 为例（假设新仓库名为 `REPO_NAME`）：

```bash
# 谨慎：先 commit 保存当前状态，再执行替换
# 1. 将 src/ 下所有以 "/" 开头的资源路径加上 `/REPO_NAME` 前缀（需自行补充）
# 2. 修改 astro.config.mjs: base: '/REPO_NAME', site: 'https://<username>.github.io'
# 3. 修改 src/pages/index.astro: Astro.redirect('/REPO_NAME/en/')
# （[slug].astro 的 filePath 逻辑基于 BASE_URL，无需改动）
```

> **手动校验**：此类反向切换涉及路径前缀批量添加，建议人工逐文件确认，避免正规表达式误伤外部链接。

#### 第 6 步：推送代码触发自动部署

```bash
git add .
git commit -m "Configure deployment settings"
git push origin main
```

推送后 GitHub Actions 会自动开始构建（触发条件定义在 `deploy.yml` 的 `on.push.branches: [main]`）。首次部署可能需要 2–3 分钟。

#### 第 7 步：验证部署结果

1. 进入仓库 → **Actions** 标签页，查看最新的 workflow 运行状态
2. 绿色对勾 ✅ 表示构建成功
3. 访问 `https://jianxing86.github.io/` 确认网站已上线（用户站点无子路径）
4. 点击各个页面，检查中英文切换、暗色模式、星表表格等功能是否正常

#### 第 8 步：配置自定义域名（可选）

如果有自己的域名，可以绑定自定义域名：

1. 在 DNS 服务商处添加 CNAME 记录，将域名指向 `jianxing86.github.io`
2. 在仓库 **Settings** → **Pages** → **Custom domain** 中填入你的域名
3. 勾选 **"Enforce HTTPS"**
4. 修改 `astro.config.mjs` 中的 `site` 为你的自定义域名，`base` 保持 `/`：
   ```javascript
   site: 'https://www.yourdomain.com',
   base: '/',
   ```
5. 在 `public/` 目录下创建 `CNAME` 文件，内容为你的域名（一行即可）：
   ```
   www.yourdomain.com
   ```

#### 第 9 步：常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|----------|
| Actions 构建失败 | Node.js 版本不匹配 | 检查 `deploy.yml` 中 `node-version` 是否为 `22`（当前配置要求 `>= 22`） |
| Actions 构建失败 | 依赖安装失败 | 确保 `package-lock.json` 已提交到仓库（`npm ci` 依赖此文件） |
| 页面显示 404 | `base` 路径配置错误 | 用户站点方案下 `base` 必须为 `/`；若改用项目站点则需与仓库名一致 |
| 页面空白无内容 | GitHub Pages 源未配置 | Settings → Pages → Source 选择 "GitHub Actions" |
| 样式丢失 | Tailwind 构建问题 | 本地运行 `npm run build` 确认无报错后再推送 |
| 图片不显示 | 资源路径错误 | 用户站点方案下路径应以 `/` 开头；检查是否残留旧的 `/personal_web/` 前缀 |
| 暗色模式不生效 | 脚本加载顺序问题 | 确认 `BaseLayout.astro` 中主题初始化脚本在 `<head>` 内 |
| 星表表格不显示 | React 水合失败 | 检查浏览器控制台是否有 JS 错误 |

---

## 9. 访问统计 (Umami)

### 9.1 环境变量说明

| 变量名 | 说明 |
|--------|------|
| `PUBLIC_UMAMI_WEBSITE_ID` | 从 Umami Cloud 后台获取的 Website ID。**为空时不加载统计脚本** |
| `PUBLIC_UMAMI_SCRIPT_URL` | 统计脚本 URL，默认为 `https://cloud.umami.is/script.js` |

本地开发时在 `.env` 中设置，生产部署时通过 GitHub Secrets 注入。

### 9.2 如何在 Umami Cloud 后台查看数据

1. 登录 [Umami Cloud](https://cloud.umami.is/)
2. 选择你的网站
3. 可查看：页面浏览量（PV）、访客数（UV）、跳出率、平均访问时长等

### 9.3 功能简介

Umami Cloud 提供以下统计功能：

- **页面浏览量**：每个页面的访问次数
- **地区分布**：访客来源国家/地区
- **来源/推荐**：访客通过哪些渠道进入网站
- **设备信息**：浏览器、操作系统、屏幕分辨率
- **实时访客**：当前在线访客数
- **自定义事件**：可跟踪按钮点击等自定义行为

---

## 10. 跨仓库内容聚合（日报等）

本项目支持将**其他仓库生成的 HTML 文件**（如另一个仓库每天生成的新闻日报）自动聚合到网站对应路径下展示。以下是基于「日报仓库 → 本站仓库 push」的方案 B 完整落地步骤，**适用于私有日报仓库**。

### 10.1 架构概览

```
日报仓库 (私有, daily-reports)
└─ 每天 cron 触发 Actions
   ├─ 抓取新闻 → 生成 reports/YYYY-MM-DD.html
   ├─ 发送邮件（已有）
   └─ 用 Fine-grained PAT push 到 jianxing86.github.io 的 public/reports/
         │
         ↓
jianxing86.github.io 仓库
├─ public/reports/YYYY-MM-DD.html  ← 被推进来
└─ main 分支有新 commit → 自动触发 deploy.yml → Astro build → 上线
```

**最终访问路径**：`https://jianxing86.github.io/reports/YYYY-MM-DD.html`

### 10.2 本站仓库一次性准备

#### 第 1 步：创建 reports 目录占位

```bash
mkdir -p public/reports
touch public/reports/.gitkeep
git add public/reports/.gitkeep
git commit -m "chore: init public/reports for daily aggregation"
```

#### 第 2 步（可选）：创建日报索引页

若希望在 `https://jianxing86.github.io/zh/reports/` 有一个归档列表页，新建 `src/pages/zh/reports/index.astro`（英文版同理复制到 `src/pages/en/reports/index.astro`）：

```astro
---
import BaseLayout from '@/components/layout/BaseLayout.astro';
import { useTranslations } from '@/i18n/ui';
import fs from 'node:fs';
import path from 'node:path';

const lang = 'zh';
const t = useTranslations(lang);

const reportsDir = path.join(process.cwd(), 'public/reports');
const files = fs.existsSync(reportsDir)
  ? fs.readdirSync(reportsDir)
      .filter((f) => f.endsWith('.html'))
      .sort()
      .reverse()
  : [];

const base = import.meta.env.BASE_URL.replace(/\/$/, '');
---
<BaseLayout title="每日新闻速递" lang={lang}>
  <div class="max-w-3xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">每日新闻速递</h1>
    <p class="text-text-light/70 dark:text-text-dark/70 mb-8">
      每日自动聚合的天文/科研相关新闻，共 {files.length} 期。
    </p>
    <ul class="space-y-2">
      {files.map((f) => (
        <li>
          <a href={`${base}/reports/${f}`}
             class="text-primary-light dark:text-primary-dark hover:underline"
             target="_blank" rel="noopener">
            {f.replace('.html', '')}
          </a>
        </li>
      ))}
    </ul>
  </div>
</BaseLayout>
```

> **注意**：若新增索引页，别忘了在 `src/components/layout/Header.astro` 的 `navItems` 数组加一项 `{ key: 'nav.reports', path: '/reports/' }`，并在 `src/i18n/{en,zh}.json` 补充 `nav.reports` 翻译 key。

### 10.3 日报仓库配置步骤

#### 第 1 步：生成 Fine-grained PAT（Personal Access Token）

1. GitHub 右上角头像 → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
2. 关键配置：
   - **Token name**：`push-to-personal-site`（任意）
   - **Expiration**：建议 1 年（到期前再续期）
   - **Resource owner**：`jianxing86`
   - **Repository access** → **Only select repositories** → 勾选 `jianxing86/jianxing86.github.io`
   - **Repository permissions** → **Contents**：`Read and write`
   - 其它权限保持默认 `No access`
3. 点击 **Generate token** → **立即复制**（离开页面后不可再看）

#### 第 2 步：将 PAT 存到日报仓库的 Secret

1. 打开日报仓库 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Name：`DEPLOY_TOKEN`
3. Value：粘贴第 1 步复制的 PAT
4. 点击 **Add secret**

#### 第 3 步：在日报仓库添加/修改 workflow

在日报仓库根目录下创建或修改 `.github/workflows/push-to-site.yml`（可与现有发送邮件的 workflow 共用一个 job，也可独立 job）：

```yaml
name: Generate daily report and push to personal site

on:
  schedule:
    - cron: '0 22 * * *'   # 每天 UTC 22:00 = 北京时间次日 06:00
  workflow_dispatch:

jobs:
  daily-report:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout daily-reports
        uses: actions/checkout@v4

      # ========== 生成日报 HTML（你原有逻辑） ==========
      - name: Setup environment
        run: |
          # 安装你抓取/生成所需依赖，例如：
          # pip install -r requirements.txt
          echo "准备运行环境"

      - name: Generate report
        id: gen
        run: |
          # 你的日报生成脚本，要求最终输出：reports/YYYY-MM-DD.html
          # python scripts/daily_news.py
          DATE=$(date -u +%Y-%m-%d)
          echo "date=$DATE" >> $GITHUB_OUTPUT

      # ========== 发送邮件（你原有逻辑） ==========
      - name: Send email
        run: |
          # 你现有的邮件发送命令
          echo "邮件已发送"

      # ========== 新增：push 到本站仓库 ==========
      - name: Clone personal site repo
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          git clone --depth 1 \
            https://x-access-token:${DEPLOY_TOKEN}@github.com/jianxing86/jianxing86.github.io.git \
            target-site

      - name: Copy report file
        run: |
          mkdir -p target-site/public/reports
          # 根据你的实际产出路径调整
          cp reports/${{ steps.gen.outputs.date }}.html target-site/public/reports/

      - name: Commit and push
        working-directory: target-site
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add public/reports/
          # 若无新增/变更则跳过 commit
          git diff --quiet --cached || \
            git commit -m "chore(reports): add ${{ steps.gen.outputs.date }}"
          git push origin main
```

#### 第 4 步：手动触发一次验证

1. 日报仓库 → **Actions** → 选中上面的 workflow → **Run workflow**
2. 等待运行完成
3. 访问 `https://github.com/jianxing86/jianxing86.github.io/commits/main` 确认有一条 `chore(reports): add ...` 提交
4. 等本站仓库的 `deploy.yml` 自动跑完（2–3 分钟）
5. 浏览器打开 `https://jianxing86.github.io/reports/YYYY-MM-DD.html` 验证

### 10.4 常见问题排查

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| push 报 403 / permission denied | PAT 权限不足 | 确认 Fine-grained PAT 选中目标仓库且 Contents 为 Read and write |
| push 报 401 / bad credentials | Secret 名称错误 / PAT 过期 | 核对 `DEPLOY_TOKEN` 名称；重新生成 PAT |
| 本站构建不触发 | push 的是非 `main` 分支 | workflow 中 `git push origin main` 必须推到 main |
| 日报 HTML 样式错乱 | HTML 引用了相对资源（CSS/JS/图片） | 在生成时把样式 inline；或把资源也一并复制到 `public/reports/assets/` 并用相对路径引用 |
| 历史日报越积越多 | 无自动清理 | 可在 workflow 末尾加一步 `find public/reports -name "*.html" -mtime +90 -delete` 保留近 90 天 |
| 想在 iframe 嵌入日报 | 需处理跨域 | 同站资源无跨域问题，用 `<iframe src="/reports/YYYY-MM-DD.html" />` 即可 |

### 10.5 安全提醒

- **PAT 仅授权目标仓库**：使用 Fine-grained token 而非 classic token，权限范围仅限 `jianxing86.github.io` 仓库
- **定期轮换**：每年到期前在 GitHub Settings 续期，并更新日报仓库 Secret
- **切勿写入仓库文件**：PAT 只在 GitHub Secrets 中保存，workflow 里只能通过 `${{ secrets.DEPLOY_TOKEN }}` 引用，不要 echo 出来
- **日报 HTML 内容审计**：由于 HTML 会被加载进站点，若日报内容含用户输入/外部数据，需在生成端做必要的 XSS 过滤

---

## 11. 常见操作速查表

| 操作 | 需要修改的文件 |
|------|--------------|
| 修改个人姓名/职称/单位 | `src/pages/en/index.astro`、`src/pages/zh/index.astro`、`src/pages/en/about.astro`、`src/pages/zh/about.astro` |
| 修改个人简介文案 | `src/i18n/en.json`（`home.hero_tagline`、`home.hero_description`）、`src/i18n/zh.json` |
| 更换头像 | `public/images/avatar.jpg`（替换文件） |
| 添加新论文 | `src/content/publications/papers.json` |
| 修改论文作者高亮名 | `src/components/ui/PublicationCard.astro`（`selfPattern` 变量） |
| 发布新博客文章 | `src/content/blog/en/新文章.md`、`src/content/blog/zh/新文章.md` |
| 添加照片墙图片 | `src/data/gallery.json`、`public/images/gallery/`（放入图片文件） |
| 添加新研究项目 | `src/content/research/en/项目名.md`、`src/content/research/zh/项目名.md` |
| 添加新星表 | `public/catalogs/数据.json`、`src/content/catalogs/en/星表名.md`、`src/content/catalogs/zh/星表名.md` |
| 修改导航栏链接 | `src/components/layout/Header.astro`（`navItems` 数组） |
| 修改页脚社交链接 | `src/components/layout/Footer.astro`（`href` 属性） |
| 修改网站标题/Logo | `src/i18n/en.json`（`site.title`）、`src/i18n/zh.json`、`src/components/layout/Header.astro` |
| 修改网站配色 | `src/styles/global.css`（`@theme` 块内的 CSS 变量） |
| 修改版权信息 | `src/i18n/en.json`（`footer.copyright`）、`src/i18n/zh.json` |
| 添加新的 UI 翻译 | `src/i18n/en.json`、`src/i18n/zh.json`（两个文件必须同步） |
| 更新简历 PDF | `public/cv.pdf`（替换文件） |
| 修改部署域名/路径 | `astro.config.mjs`（`site` 字段；用户站点方案下 `base` 保持 `/`） |
| 接入其他仓库生成的日报 HTML | 见第 10 节「跨仓库内容聚合」：在日报仓库 push 到本仓库 `public/reports/` |
