-- =====================================================================
-- Culture Bar : table du classement partagé
-- À coller une seule fois dans Supabase > SQL Editor, puis « Run ».
-- =====================================================================

create table if not exists public.classement (
  id          uuid primary key,
  secret_hash text not null,
  prenom      text not null check (char_length(prenom) between 1 and 20),
  sues        int  not null default 0 check (sues between 0 and 2000),
  total       int  not null default 0 check (total between 0 and 2000),
  maj         timestamptz not null default now()
);

-- Lecture publique du classement, sans jamais exposer la colonne secret_hash
alter table public.classement enable row level security;
drop policy if exists "lecture publique" on public.classement;
create policy "lecture publique" on public.classement for select to anon, authenticated using (true);
revoke all on public.classement from anon, authenticated;
grant select (id, prenom, sues, total, maj) on public.classement to anon, authenticated;

-- Écriture uniquement via ces fonctions : chaque téléphone ne peut modifier que sa propre ligne
create or replace function public.envoyer_score(p_id uuid, p_secret text, p_prenom text, p_sues int, p_total int)
returns void language plpgsql security definer set search_path = public as $$
declare
  h text;
begin
  if p_secret is null or char_length(p_secret) < 16 then raise exception 'secret invalide'; end if;
  p_prenom := left(btrim(regexp_replace(coalesce(p_prenom, ''), '\s+', ' ', 'g')), 20);
  if p_prenom = '' then raise exception 'prénom vide'; end if;
  h := encode(sha256(convert_to(p_secret, 'UTF8')), 'hex');
  insert into public.classement (id, secret_hash, prenom, sues, total, maj)
  values (p_id, h, p_prenom, greatest(0, least(p_sues, 2000)), greatest(0, least(p_total, 2000)), now())
  on conflict (id) do update
    set prenom = excluded.prenom, sues = excluded.sues, total = excluded.total, maj = now()
    where public.classement.secret_hash = excluded.secret_hash;
end $$;

create or replace function public.supprimer_score(p_id uuid, p_secret text)
returns void language sql security definer set search_path = public as $$
  delete from public.classement
  where id = p_id and secret_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex');
$$;

revoke all on function public.envoyer_score(uuid, text, text, int, int) from public;
revoke all on function public.supprimer_score(uuid, text) from public;
grant execute on function public.envoyer_score(uuid, text, text, int, int) to anon, authenticated;
grant execute on function public.supprimer_score(uuid, text) to anon, authenticated;
