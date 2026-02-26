import { z, type ZodTypeAny } from 'zod';

const tagsSchema = z.union([z.array(z.string().min(1)).max(20), z.string().max(300)]).optional();

export const loginSchema = z.object({
  username: z.string().min(3).max(80),
  password: z.string().min(3).max(200)
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().min(2).max(200),
  message: z.string().trim().min(2).max(5000),
  captcha_token: z.string().trim().max(2000).optional()
});

export const projectSchema = z.object({
  slug: z.string().trim().min(2).max(180).optional(),
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().trim().max(500).optional(),
  category: z.string().trim().min(2).max(100),
  image_url: z.string().trim().max(1000).optional(),
  tags: tagsSchema,
  role: z.string().trim().max(200).optional(),
  duration: z.string().trim().max(120).optional(),
  technologies: z.string().trim().max(500).optional(),
  status: z.string().trim().max(80).optional(),
  overview: z.string().trim().max(6000).optional(),
  features: z.string().trim().max(6000).optional(),
  implementation: z.string().trim().max(6000).optional(),
  challenges: z.string().trim().max(6000).optional(),
  results: z.string().trim().max(6000).optional(),
  future_enhancements: z.string().trim().max(6000).optional(),
  github_url: z.string().trim().max(1000).optional(),
  demo_url: z.string().trim().max(1000).optional(),
  docs_url: z.string().trim().max(1000).optional(),
  is_published: z.boolean().optional(),
  publish_at: z.string().trim().max(80).optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().min(-100000).max(100000).optional()
});

export const blogSchema = z.object({
  slug: z.string().trim().min(2).max(180).optional(),
  title: z.string().trim().min(2).max(220),
  summary: z.string().trim().max(1000).optional(),
  content: z.string().trim().min(2).max(100000),
  date_label: z.string().trim().max(80).optional(),
  tags: tagsSchema,
  image_url: z.string().trim().max(1000).optional(),
  author_name: z.string().trim().max(120).optional(),
  author_bio: z.string().trim().max(1000).optional(),
  is_published: z.boolean().optional(),
  publish_at: z.string().trim().max(80).optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().int().min(-100000).max(100000).optional()
});

export function parsePayload<T extends ZodTypeAny>(schema: T, payload: unknown): z.infer<T> {
  const result = schema.safeParse(payload || {});
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(issue?.message || 'Invalid request payload');
  }
  return result.data;
}

export function normalizeTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
}

export function slugify(input: string): string {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
