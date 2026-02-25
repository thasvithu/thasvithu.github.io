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

insert into projects (
  slug, title, subtitle, category, image_url, tags,
  role, duration, technologies, status,
  overview, features, implementation, challenges, results, future_enhancements,
  github_url, demo_url, docs_url,
  is_published, publish_at, featured, sort_order, updated_by
) values (
  'multi-agent-research-assistant',
  'Multi-Agent Research Assistant',
  'A production-ready agent workflow for retrieval, summarization, and structured output',
  'ai-agents',
  'images/projects/rag.png',
  array['AI Agents','RAG','OpenRouter','FastAPI','Prompt Engineering'],
  'AI Engineer',
  '4 Months',
  'Python, FastAPI, OpenRouter, PostgreSQL, Redis',
  'Completed',
  'Built an assistant that coordinates multiple specialized agents for retrieval, planning, and synthesis tasks.',
  'Planner/executor architecture, memory-aware prompts, source-grounded answers, and retry policies for resilient generation.',
  'Implemented agent orchestration with task routing, vector retrieval, and context windows optimized by chunk strategy.',
  'Managing tool-call reliability, hallucination control, and token cost under high-load sessions.',
  'Reduced research turnaround time by 45% and improved answer traceability with citation-backed outputs.',
  'Add user-level personalization, workflow analytics, and automated benchmark regression tests.',
  'https://github.com/thasvithu',
  '',
  '',
  true, now(), true, 30, 'seed'
)
on conflict (slug) do nothing;

insert into projects (
  slug, title, subtitle, category, image_url, tags,
  role, duration, technologies, status,
  overview, features, implementation, challenges, results, future_enhancements,
  github_url, demo_url, docs_url,
  is_published, publish_at, featured, sort_order, updated_by
) values (
  'customer-churn-intelligence-platform',
  'Customer Churn Intelligence Platform',
  'End-to-end churn prediction and retention intelligence for subscription products',
  'data-science',
  'images/projects/rag.png',
  array['Machine Learning','MLOps','XGBoost','Feature Engineering','Dashboard'],
  'Data Scientist',
  '3 Months',
  'Python, scikit-learn, XGBoost, Pandas, Supabase',
  'Completed',
  'Designed a churn analytics pipeline to identify at-risk users and recommend intervention actions.',
  'Automated feature pipeline, calibrated probability outputs, segment-level risk breakdown, and actionable retention suggestions.',
  'Trained and validated ensemble models, deployed scheduled inference jobs, and exposed insights through a web dashboard.',
  'Class imbalance, drift in behavior signals, and translating predictions into business-friendly interventions.',
  'Improved early churn detection recall by 31% and increased targeted retention campaign conversion.',
  'Introduce uplift modeling, real-time event scoring, and monthly drift monitoring with alerts.',
  'https://github.com/thasvithu',
  '',
  '',
  true, now(), false, 20, 'seed'
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

insert into blog_posts (
  slug, title, summary, content, date_label, tags, image_url, author_name, author_bio,
  is_published, publish_at, featured, sort_order, updated_by
) values (
  'designing-multi-agent-rag-systems',
  'Designing Multi-Agent RAG Systems for Reliable Research Workflows',
  'A practical guide to architecting planner-executor-retriever agent patterns with measurable quality controls.',
  'Multi-agent RAG is more than splitting tasks across LLM calls. A robust system needs explicit planning boundaries, strict tool contracts, and grounded synthesis. In this article, I break down a planner-executor-retriever architecture, discuss chunking and reranking strategy, and explain how to evaluate with precision@k, faithfulness, and answer completeness. I also include failure patterns and mitigation tactics used in real deployments.',
  'Feb 2026',
  array['RAG','AI Agents','LLM Ops','Evaluation'],
  'images/blog/responsive-web-design.png',
  'Vimalathas Vithusan',
  'Data Scientist and AI engineer focused on reliable production AI systems.',
  true, now(), true, 30, 'seed'
)
on conflict (slug) do nothing;

insert into blog_posts (
  slug, title, summary, content, date_label, tags, image_url, author_name, author_bio,
  is_published, publish_at, featured, sort_order, updated_by
) values (
  'from-prototype-to-production-ml',
  'From Prototype to Production ML: A Practical Delivery Checklist',
  'A deployment-focused checklist for moving ML notebooks into dependable, monitorable production systems.',
  'Many ML projects fail between notebook accuracy and production reliability. This post covers the delivery checklist I use: data contract validation, reproducible training, model registry versioning, baseline and canary checks, and post-deploy monitoring for drift and latency. I also share a pragmatic release workflow for small teams using CI, scheduled evaluation, and rollback-safe deployment patterns.',
  'Jan 2026',
  array['Machine Learning','MLOps','Production','Data Engineering'],
  'images/blog/responsive-web-design.png',
  'Vimalathas Vithusan',
  'Data Scientist and AI engineer focused on reliable production AI systems.',
  true, now(), false, 20, 'seed'
)
on conflict (slug) do nothing;
