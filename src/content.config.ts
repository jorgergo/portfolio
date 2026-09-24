import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { makeCvSchema } from '@/lib/cv-schema';

const cv = defineCollection({
  loader: file('src/content/cv.json'),
  schema: ({ image }) => makeCvSchema(image),
});

export const collections = { cv };
