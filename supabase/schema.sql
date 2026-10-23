-- =============================================================================
-- KEYCON — esquema do banco no Supabase
-- -----------------------------------------------------------------------------
-- Como usar: Supabase → SQL Editor → New query → colar este arquivo → Run.
-- Cada corretor só enxerga e altera os PRÓPRIOS dados (Row Level Security).
-- Fotos e áudios ficam no Storage, no bucket "media", em pastas por usuário:
--   media/<id do usuário>/<arquivo>
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfil do corretor (nome, CRECI, imobiliária, telefone)
-- Criado automaticamente no cadastro (e-mail/senha ou Google).
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  creci       text not null default '',
  agency      text not null default '',
  phone       text not null default '',
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, creci, agency, phone)
  values (
    new.id,
    -- Cadastro pelo app envia name/creci/agency/phone; o Google envia full_name
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'creci', ''),
    coalesce(new.raw_user_meta_data ->> 'agency', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Catálogo: pastas → imóveis → fotos/vídeos
-- -----------------------------------------------------------------------------
create table if not exists public.folders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name          text not null,
  neighborhood  text,
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.products (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  folder_id          uuid not null references public.folders (id) on delete cascade,
  title              text not null,
  price              numeric(14, 2) not null check (price > 0),
  deal_type          text not null default 'venda' check (deal_type in ('venda', 'locacao')),
  bedrooms           integer,
  area_m2            integer,
  short_description  text not null default '',
  datasheet_url      text not null default '',
  position           integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.media (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id    uuid not null references public.products (id) on delete cascade,
  type          text not null check (type in ('image', 'video')),
  title         text not null default '',
  url           text not null,
  -- Caminho no Storage quando o arquivo foi enviado pelo app (vazio = link externo)
  storage_path  text,
  duration      text,
  position      integer not null default 0,
  created_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Atalhos de texto e de áudio
-- -----------------------------------------------------------------------------
create table if not exists public.text_shortcuts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title       text not null,
  body        text not null,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.audio_shortcuts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title         text not null,
  audio_url     text not null,
  storage_path  text,
  duration      text not null default '',
  transcript    text not null default '',
  position      integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists folders_user_idx         on public.folders (user_id);
create index if not exists products_folder_idx      on public.products (folder_id);
create index if not exists media_product_idx        on public.media (product_id);
create index if not exists text_shortcuts_user_idx  on public.text_shortcuts (user_id);
create index if not exists audio_shortcuts_user_idx on public.audio_shortcuts (user_id);

-- -----------------------------------------------------------------------------
-- Row Level Security: cada corretor só acessa as próprias linhas
-- -----------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.folders         enable row level security;
alter table public.products        enable row level security;
alter table public.media           enable row level security;
alter table public.text_shortcuts  enable row level security;
alter table public.audio_shortcuts enable row level security;

drop policy if exists "perfil do proprio usuario" on public.profiles;
create policy "perfil do proprio usuario" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "pastas do proprio usuario" on public.folders;
create policy "pastas do proprio usuario" on public.folders
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "imoveis do proprio usuario" on public.products;
-- Além do dono, confere que a pasta / o imóvel de destino também são do usuário
create policy "imoveis do proprio usuario" on public.products
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.folders f where f.id = folder_id and f.user_id = auth.uid())
  );

drop policy if exists "midias do proprio usuario" on public.media;
create policy "midias do proprio usuario" on public.media
  for all using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.products p where p.id = product_id and p.user_id = auth.uid())
  );

drop policy if exists "atalhos de texto do proprio usuario" on public.text_shortcuts;
create policy "atalhos de texto do proprio usuario" on public.text_shortcuts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "atalhos de audio do proprio usuario" on public.audio_shortcuts;
create policy "atalhos de audio do proprio usuario" on public.audio_shortcuts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- Storage: bucket "media" para fotos, vídeos e áudios
-- Leitura pública: o link direto do arquivo é o que o teclado envia ao cliente
-- e o que permite mandar a foto "direto na conversa". Os nomes dos arquivos
-- são aleatórios (não dá para adivinhar), mas quem tiver o link consegue abrir.
-- Envio, troca e exclusão: só dentro da pasta do próprio usuário.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800) -- 50 MB por arquivo
on conflict (id) do nothing;

drop policy if exists "enviar arquivos na propria pasta" on storage.objects;
create policy "enviar arquivos na propria pasta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "alterar arquivos da propria pasta" on storage.objects;
create policy "alterar arquivos da propria pasta" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "excluir arquivos da propria pasta" on storage.objects;
create policy "excluir arquivos da propria pasta" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
