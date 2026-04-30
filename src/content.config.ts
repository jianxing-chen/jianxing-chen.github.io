import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['ongoing', 'completed']),
    description: z.string(),
    cover: z.string().optional(),
    tags: z.array(z.string()),
    order: z.number().default(0),
  }),
});

const catalogs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/catalogs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    version: z.string().optional(),
    rows: z.number().optional(),
    dataFile: z.string(),
    columns: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['string', 'number', 'ra', 'dec']).default('string'),
    })),
    citation: z.string().optional(),
    doi: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    description: z.string(),
    cover: z.string().optional(),
    lang: z.enum(['en', 'zh']),
    draft: z.boolean().default(false),
  }),
});

export const collections = { research, catalogs, blog };
