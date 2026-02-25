import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import type { QueryResultRow } from 'pg';
import { config } from './config.js';
import { query } from './db.js';
import { sendContactMail } from './mail.js';
import { createAuthHelpers } from './auth.js';
import {
  blogSchema,
  contactSchema,
  loginSchema,
  normalizeTags,
  parsePayload,
  projectSchema,
  slugify
} from './validation.js';
import { uploadToSupabaseStorage } from './storage.js';
import { verifyCaptchaToken } from './captcha.js';

type PublicProjectRow = QueryResultRow & {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  image_url: string | null;
  tags: string[];
  role: string | null;
  duration: string | null;
  technologies: string | null;
  status: string | null;
  is_published: boolean;
  publish_at: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PublicBlogRow = QueryResultRow & {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  date_label: string | null;
  tags: string[];
  image_url: string | null;
  author_name: string | null;
  is_published: boolean;
  publish_at: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const app = express();
const auth = createAuthHelpers(config);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Hugging Face Spaces runs behind a proxy; needed for correct client IP and rate limits.
app.set('trust proxy', 1);

app.use(helmet());
app.use(requestLogger);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
  })
);
app.use(express.json({ limit: '1mb' }));

const publicLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });

app.use('/api', publicLimiter);
app.use('/api/admin', adminLimiter);

app.get(
  '/api/health',
  asyncHandler(async (_req, res) => {
    const db = await query<{ now: string }>('select now() as now');
    res.json({ ok: true, db: db.rows[0].now });
  })
);

app.post(
  '/api/admin/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const payload = parsePayload(loginSchema, req.body);
    if (!auth.credentialsValid(payload.username, payload.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = auth.signAdminToken({ sub: payload.username, role: 'admin' });
    await logAdminAction(payload.username, 'login', 'auth', null, null);
    res.json({ token });
  })
);

app.get(
  '/api/projects',
  asyncHandler(async (_req, res) => {
    const result = await query<PublicProjectRow>(
      `select id, slug, title, subtitle, category, image_url, tags, role, duration, technologies, status,
              is_published, publish_at, featured, sort_order, created_at, updated_at
       from projects
       where is_published = true and (publish_at is null or publish_at <= now())
       order by created_at desc`
    );
    res.json(result.rows);
  })
);

app.get(
  '/api/projects/:slug',
  asyncHandler(async (req, res) => {
    const result = await query<QueryResultRow>(
      `select *
       from projects
       where slug = $1
         and is_published = true
         and (publish_at is null or publish_at <= now())
       limit 1`,
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });
    res.json(result.rows[0]);
  })
);

app.get(
  '/api/blogs',
  asyncHandler(async (_req, res) => {
    const result = await query<PublicBlogRow>(
      `select id, slug, title, summary, date_label, tags, image_url, author_name,
              is_published, publish_at, featured, sort_order, created_at, updated_at
       from blog_posts
       where is_published = true and (publish_at is null or publish_at <= now())
       order by created_at desc`
    );
    res.json(result.rows);
  })
);

app.get(
  '/api/blogs/:slug',
  asyncHandler(async (req, res) => {
    const result = await query<QueryResultRow>(
      `select *
       from blog_posts
       where slug = $1
         and is_published = true
         and (publish_at is null or publish_at <= now())
       limit 1`,
      [req.params.slug]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Blog post not found' });
    res.json(result.rows[0]);
  })
);

app.post(
  '/api/contact',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const payload = parsePayload(contactSchema, req.body);
    const captcha = await verifyCaptchaToken(payload.captcha_token, req.ip);
    if (!captcha.ok) {
      return res.status(400).json({ error: `Captcha verification failed: ${captcha.reason}` });
    }

    await query('insert into contact_messages(name, email, subject, message) values($1, $2, $3, $4)', [
      payload.name,
      payload.email,
      payload.subject,
      payload.message
    ]);

    const mailStatus = await sendContactMail(payload);
    res.status(201).json({
      success: true,
      emailSent: mailStatus.sent,
      emailInfo: mailStatus.sent ? 'sent' : mailStatus.reason
    });
  })
);

app.post(
  '/api/admin/upload',
  adminGuard,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file is required' });
    const result = await uploadToSupabaseStorage(req.file);
    await logAdminAction(req.admin?.sub || 'admin', 'upload', 'media', null, { path: result.objectPath });
    res.status(201).json(result);
  })
);

app.get(
  '/api/admin/messages',
  adminGuard,
  asyncHandler(async (_req, res) => {
    const result = await query<QueryResultRow>(
      `select id, name, email, subject, message, created_at
       from contact_messages
       order by created_at desc
       limit 200`
    );
    res.json(result.rows);
  })
);

app.get(
  '/api/admin/audit-logs',
  adminGuard,
  asyncHandler(async (_req, res) => {
    const result = await query<QueryResultRow>(
      `select id, actor, action, entity_type, entity_id, metadata, created_at
       from admin_audit_logs
       order by created_at desc
       limit 200`
    );
    res.json(result.rows);
  })
);

app.get(
  '/api/admin/projects',
  adminGuard,
  asyncHandler(async (_req, res) => {
    const result = await query<QueryResultRow>('select * from projects order by created_at desc');
    res.json(result.rows);
  })
);

app.post(
  '/api/admin/projects',
  adminGuard,
  asyncHandler(async (req, res) => {
    const payload = parsePayload(projectSchema, req.body);
    const slug = payload.slug || slugify(payload.title);
    const publishAt = parsePublishAt(payload.publish_at);

    const result = await query<QueryResultRow>(
      `insert into projects (
        slug, title, subtitle, category, image_url, tags,
        role, duration, technologies, status,
        overview, features, implementation, challenges, results, future_enhancements,
        github_url, demo_url, docs_url,
        is_published, publish_at, featured, sort_order, updated_by
      ) values (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,
        $17,$18,$19,
        $20,$21,$22,$23,$24
      ) returning *`,
      [
        slug,
        payload.title,
        payload.subtitle || '',
        payload.category,
        payload.image_url || '',
        normalizeTags(payload.tags),
        payload.role || '',
        payload.duration || '',
        payload.technologies || '',
        payload.status || 'Active',
        payload.overview || '',
        payload.features || '',
        payload.implementation || '',
        payload.challenges || '',
        payload.results || '',
        payload.future_enhancements || '',
        payload.github_url || '',
        payload.demo_url || '',
        payload.docs_url || '',
        payload.is_published ?? true,
        publishAt,
        payload.featured ?? false,
        payload.sort_order ?? 0,
        req.admin?.sub || 'admin'
      ]
    );

    await logAdminAction(req.admin?.sub || 'admin', 'create', 'project', String(result.rows[0].id), {
      slug: String(result.rows[0].slug),
      title: String(result.rows[0].title)
    });

    res.status(201).json(result.rows[0]);
  })
);

app.put(
  '/api/admin/projects/:id',
  adminGuard,
  asyncHandler(async (req, res) => {
    const payload = parsePayload(projectSchema, req.body);
    const slug = payload.slug || slugify(payload.title);
    const publishAt = parsePublishAt(payload.publish_at);

    const result = await query<QueryResultRow>(
      `update projects set
        slug=$1, title=$2, subtitle=$3, category=$4, image_url=$5, tags=$6,
        role=$7, duration=$8, technologies=$9, status=$10,
        overview=$11, features=$12, implementation=$13, challenges=$14, results=$15,
        future_enhancements=$16, github_url=$17, demo_url=$18, docs_url=$19,
        is_published=$20, publish_at=$21, featured=$22, sort_order=$23, updated_by=$24
       where id=$25
       returning *`,
      [
        slug,
        payload.title,
        payload.subtitle || '',
        payload.category,
        payload.image_url || '',
        normalizeTags(payload.tags),
        payload.role || '',
        payload.duration || '',
        payload.technologies || '',
        payload.status || 'Active',
        payload.overview || '',
        payload.features || '',
        payload.implementation || '',
        payload.challenges || '',
        payload.results || '',
        payload.future_enhancements || '',
        payload.github_url || '',
        payload.demo_url || '',
        payload.docs_url || '',
        payload.is_published ?? true,
        publishAt,
        payload.featured ?? false,
        payload.sort_order ?? 0,
        req.admin?.sub || 'admin',
        req.params.id
      ]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });

    await logAdminAction(req.admin?.sub || 'admin', 'update', 'project', String(result.rows[0].id), {
      slug: String(result.rows[0].slug),
      title: String(result.rows[0].title)
    });

    res.json(result.rows[0]);
  })
);

app.delete(
  '/api/admin/projects/:id',
  adminGuard,
  asyncHandler(async (req, res) => {
    const result = await query<QueryResultRow>('delete from projects where id=$1 returning id, slug, title', [
      req.params.id
    ]);
    if (!result.rows.length) return res.status(404).json({ error: 'Project not found' });

    await logAdminAction(req.admin?.sub || 'admin', 'delete', 'project', String(result.rows[0].id), {
      slug: String(result.rows[0].slug),
      title: String(result.rows[0].title)
    });

    res.json({ success: true });
  })
);

app.get(
  '/api/admin/blogs',
  adminGuard,
  asyncHandler(async (_req, res) => {
    const result = await query<QueryResultRow>('select * from blog_posts order by created_at desc');
    res.json(result.rows);
  })
);

app.post(
  '/api/admin/blogs',
  adminGuard,
  asyncHandler(async (req, res) => {
    const payload = parsePayload(blogSchema, req.body);
    const slug = payload.slug || slugify(payload.title);
    const publishAt = parsePublishAt(payload.publish_at);

    const result = await query<QueryResultRow>(
      `insert into blog_posts (
        slug, title, summary, content, date_label, tags, image_url, author_name, author_bio,
        is_published, publish_at, featured, sort_order, updated_by
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      returning *`,
      [
        slug,
        payload.title,
        payload.summary || '',
        payload.content,
        payload.date_label || '',
        normalizeTags(payload.tags),
        payload.image_url || '',
        payload.author_name || 'Vimalathas Vithusan',
        payload.author_bio || '',
        payload.is_published ?? true,
        publishAt,
        payload.featured ?? false,
        payload.sort_order ?? 0,
        req.admin?.sub || 'admin'
      ]
    );

    await logAdminAction(req.admin?.sub || 'admin', 'create', 'blog', String(result.rows[0].id), {
      slug: String(result.rows[0].slug),
      title: String(result.rows[0].title)
    });

    res.status(201).json(result.rows[0]);
  })
);

app.put(
  '/api/admin/blogs/:id',
  adminGuard,
  asyncHandler(async (req, res) => {
    const payload = parsePayload(blogSchema, req.body);
    const slug = payload.slug || slugify(payload.title);
    const publishAt = parsePublishAt(payload.publish_at);

    const result = await query<QueryResultRow>(
      `update blog_posts set
        slug=$1, title=$2, summary=$3, content=$4, date_label=$5,
        tags=$6, image_url=$7, author_name=$8, author_bio=$9,
        is_published=$10, publish_at=$11, featured=$12, sort_order=$13, updated_by=$14
       where id=$15
       returning *`,
      [
        slug,
        payload.title,
        payload.summary || '',
        payload.content,
        payload.date_label || '',
        normalizeTags(payload.tags),
        payload.image_url || '',
        payload.author_name || 'Vimalathas Vithusan',
        payload.author_bio || '',
        payload.is_published ?? true,
        publishAt,
        payload.featured ?? false,
        payload.sort_order ?? 0,
        req.admin?.sub || 'admin',
        req.params.id
      ]
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Blog not found' });

    await logAdminAction(req.admin?.sub || 'admin', 'update', 'blog', String(result.rows[0].id), {
      slug: String(result.rows[0].slug),
      title: String(result.rows[0].title)
    });

    res.json(result.rows[0]);
  })
);

app.delete(
  '/api/admin/blogs/:id',
  adminGuard,
  asyncHandler(async (req, res) => {
    const result = await query<QueryResultRow>('delete from blog_posts where id=$1 returning id, slug, title', [
      req.params.id
    ]);
    if (!result.rows.length) return res.status(404).json({ error: 'Blog not found' });

    await logAdminAction(req.admin?.sub || 'admin', 'delete', 'blog', String(result.rows[0].id), {
      slug: String(result.rows[0].slug),
      title: String(result.rows[0].title)
    });

    res.json({ success: true });
  })
);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = String((error as Error)?.message || 'Internal Server Error');
  const status = /invalid|required|not found|unauthorized|credentials|configured|allowed|captcha/i.test(message)
    ? 400
    : 500;

  res.status(status).json({ error: message });
});

app.listen(config.port, () => {
  console.log(`Backend API running at http://localhost:${config.port}`);
});

function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = cryptoRandomId();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ${requestId}`);
  });
  next();
}

function adminGuard(req: Request, res: Response, next: NextFunction): Response | void {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.admin = auth.verifyAdminToken(token);
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function parsePublishAt(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('publish_at must be a valid datetime');
  }
  return date.toISOString();
}

async function logAdminAction(
  actor: string,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> | null
): Promise<void> {
  await query(
    `insert into admin_audit_logs(actor, action, entity_type, entity_id, metadata)
     values($1,$2,$3,$4,$5)`,
    [actor, action, entityType, entityId, metadata]
  );
}

function cryptoRandomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return function wrapped(req: Request, res: Response, next: NextFunction): void {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
