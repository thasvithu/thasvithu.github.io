insert into projects (
  slug, title, subtitle, category, image_url, tags,
  role, duration, technologies, status,
  overview, features, implementation, challenges, results, future_enhancements,
  github_url, demo_url, docs_url,
  is_published, publish_at, featured, sort_order, updated_by
) values (
  'rag-based-intelligent-chatbot',
  'RAG-Based Intelligent Chatbot',
  'An AI-powered chatbot using Retrieval-Augmented Generation for accurate, context-aware responses',
  'rag',
  'images/projects/rag.png',
  array['Python','RAG','LangChain','AI'],
  'Full Stack Developer',
  '3 Months',
  'Python, LangChain, OpenAI',
  'Completed',
  'A modular RAG chatbot that retrieves relevant context from documents before generating answers.',
  'Document ingestion, semantic retrieval, source citations, and conversation continuity.',
  'Built with LangChain, vector storage, and a web UI flow for document Q&A.',
  'Balancing retrieval quality with response latency.',
  'Improved internal knowledge lookup speed and answer consistency.',
  'Add multilingual support and analytics.',
  '', '', '',
  true, now(), true, 10, 'seed'
)
on conflict (slug) do nothing;

insert into blog_posts (
  slug, title, summary, content, date_label, tags, image_url, author_name, author_bio,
  is_published, publish_at, featured, sort_order, updated_by
) values (
  'mastering-responsive-web-design',
  'Mastering Responsive Web Design: A Complete Guide',
  'Core principles and practical tips for creating websites that adapt across devices.',
  'Responsive web design ensures your website works across mobile, tablet, and desktop. Focus on fluid grids, flexible images, and media queries. Start mobile-first, optimize performance, and test with real devices.',
  'June 4, 2020',
  array['HTML','CSS','Web Design'],
  'images/blog/responsive-web-design.png',
  'Vimalathas Vithusan',
  'Backend Developer & Data Science Enthusiast building intelligent applications.',
  true, now(), true, 10, 'seed'
)
on conflict (slug) do nothing;
