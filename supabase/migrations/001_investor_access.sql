create table if not exists public.investor_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  label text,
  max_uses integer not null default 1 check (max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.investor_sessions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.investor_codes(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.xiluqt_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.investor_codes enable row level security;
alter table public.investor_sessions enable row level security;
alter table public.xiluqt_admins enable row level security;

create or replace function public.redeem_investor_code(p_code_hash text, p_token_hash text, p_expires_at timestamptz)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  update public.investor_codes
     set use_count = use_count + 1
   where code_hash = p_code_hash
     and revoked_at is null
     and (expires_at is null or expires_at > now())
     and use_count < max_uses
  returning id into v_id;

  if v_id is null then
    return null;
  end if;

  insert into public.investor_sessions(code_id, token_hash, expires_at)
  values (v_id, p_token_hash, p_expires_at);

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
begin
  update public.investor_sessions s
     set last_seen_at = now()
    from public.investor_codes c
   where s.token_hash = p_token_hash
     and s.code_id = c.id
     and s.expires_at > now()
     and c.revoked_at is null
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

revoke all on function public.redeem_investor_code(text,text,timestamptz) from public, anon, authenticated;
revoke all on function public.validate_investor_session(text) from public, anon, authenticated;
