-- Phase 1: Restaurant Intelligence — AI insights backed by verified metrics

create table if not exists ai_insights (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  insight_type text not null,
  source_metrics jsonb not null default '{}'::jsonb,
  generated_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_insights_restaurant_time
  on ai_insights(restaurant_id, created_at desc);

create index if not exists idx_ai_insights_type
  on ai_insights(restaurant_id, insight_type, created_at desc);

alter table ai_insights enable row level security;

create policy "Allow ai insights for demo" on ai_insights
  for all using (true) with check (true);
