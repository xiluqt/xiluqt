create extension if not exists pgcrypto;

create table if not exists public.investor_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text,
  expires_at timestamptz,
  max_uses integer,
  use_count integer not null default 0,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create table if not exists public.investor_sessions (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.investor_access_codes(id) on delete cascade,
  session_token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.investor_access_logs (
  id bigint generated always as identity primary key,
  access_code_id uuid references public.investor_access_codes(id) on delete set null,
  event_type text not null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists public.xiluqt_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.investor_access_codes enable row level security;
alter table public.investor_sessions enable row level security;
alter table public.investor_access_logs enable row level security;
alter table public.xiluqt_admins enable row level security;

revoke all on public.investor_access_codes from anon, authenticated;
revoke all on public.investor_sessions from anon, authenticated;
revoke all on public.investor_access_logs from anon, authenticated;
revoke all on public.xiluqt_admins from anon, authenticated;

create index if not exists investor_access_codes_expires_idx on public.investor_access_codes (expires_at);
create index if not exists investor_sessions_expires_idx on public.investor_sessions (expires_at);
create index if not exists investor_access_logs_created_idx on public.investor_access_logs (created_at desc);

create or replace function public.redeem_investor_code(
  p_code_hash text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.investor_access_codes
     set use_count = use_count + 1,
         last_used_at = now()
   where code_hash = p_code_hash
     and revoked_at is null
     and (expires_at is null or expires_at > now())
     and (max_uses is null or use_count < max_uses)
  returning id into v_id;

  if v_id is null then
    return null;
  end if;

  insert into public.investor_sessions(access_code_id, session_token_hash, expires_at)
  values (v_id, p_token_hash, p_expires_at);

  insert into public.investor_access_logs(access_code_id, event_type)
  values (v_id, 'redeemed');

  return v_id;
end;
$$;

create or replace function public.validate_investor_session(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ok boolean;
  v_code_id uuid;
begin
  select s.access_code_id into v_code_id
    from public.investor_sessions s
    join public.investor_access_codes c on c.id = s.access_code_id
   where s.session_token_hash = p_token_hash
     and s.expires_at > now()
     and c.revoked_at is null
   limit 1;

  if v_code_id is null then
    return false;
  end if;

  update public.investor_sessions
     set last_seen_at = now()
   where session_token_hash = p_token_hash;

  insert into public.investor_access_logs(access_code_id, event_type)
  values (v_code_id, 'prototype_access');

  return true;
end;
$$;

revoke all on function public.redeem_investor_code(text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.validate_investor_session(text) from public, anon, authenticated;
