create table public.storefront_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 48),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  description text not null default '' check (char_length(description) <= 300),
  whatsapp text not null default '' check (whatsapp = '' or whatsapp ~ '^[1-9][0-9]{7,14}$'),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.storefront_workspaces enable row level security;
revoke all on public.storefront_workspaces from anon, authenticated;
grant select (id, slug, name, description, whatsapp, published) on public.storefront_workspaces to anon, authenticated;
grant insert (owner_id, slug, name, description, whatsapp) on public.storefront_workspaces to authenticated;
grant update (name, description, whatsapp, published) on public.storefront_workspaces to authenticated;
create policy "Read public storefronts" on public.storefront_workspaces for select to anon, authenticated using (published);
create policy "Owners read their own storefronts" on public.storefront_workspaces for select to authenticated using ((select auth.uid()) = owner_id);
create policy "Owners create their own storefronts" on public.storefront_workspaces for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "Owners update their own storefronts" on public.storefront_workspaces for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create function public.my_storefront_workspaces()
returns table (id uuid, slug text, name text, description text, whatsapp text, published boolean)
language sql stable security definer set search_path = ''
as $$
  select w.id, w.slug, w.name, w.description, w.whatsapp, w.published
  from public.storefront_workspaces w
  where w.owner_id = (select auth.uid())
  order by w.slug
$$;
revoke execute on function public.my_storefront_workspaces() from public, anon;
grant execute on function public.my_storefront_workspaces() to authenticated;
