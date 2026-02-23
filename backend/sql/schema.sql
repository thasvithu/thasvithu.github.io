create table if not exists projects (
  id bigserial primary key,
  slug text unique not null,
  title text not null,
  subtitle text,
  category text not null,
  image_url text,
  tags text[] default '{}',
  role text,
  duration text,
  technologies text,
  status text,
  overview text,
  features text,
  implementation text,
  challenges text,
  results text,
  future_enhancements text,
  github_url text,
  demo_url text,
  docs_url text,
  is_published boolean default true,
  publish_at timestamptz,
  featured boolean default false,
  sort_order integer default 0,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists blog_posts (
  id bigserial primary key,
  slug text unique not null,
  title text not null,
  summary text,
  content text not null,
  date_label text,
  tags text[] default '{}',
  image_url text,
  author_name text,
  author_bio text,
  is_published boolean default true,
  publish_at timestamptz,
  featured boolean default false,
  sort_order integer default 0,
  updated_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists contact_messages (
  id bigserial primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists admin_audit_logs (
  id bigserial primary key,
  actor text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on projects;
create trigger trg_projects_updated_at
before update on projects
for each row execute procedure set_updated_at();

drop trigger if exists trg_blog_posts_updated_at on blog_posts;
create trigger trg_blog_posts_updated_at
before update on blog_posts
for each row execute procedure set_updated_at();

alter table projects add column if not exists is_published boolean default true;
alter table projects add column if not exists publish_at timestamptz;
alter table projects add column if not exists featured boolean default false;
alter table projects add column if not exists sort_order integer default 0;
alter table projects add column if not exists updated_by text;

alter table blog_posts add column if not exists is_published boolean default true;
alter table blog_posts add column if not exists publish_at timestamptz;
alter table blog_posts add column if not exists featured boolean default false;
alter table blog_posts add column if not exists sort_order integer default 0;
alter table blog_posts add column if not exists updated_by text;
