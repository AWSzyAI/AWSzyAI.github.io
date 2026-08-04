create table if not exists public.user_documents (
    user_id uuid not null references auth.users(id) on delete cascade,
    document_type text not null check (document_type in ('money', 'tax')),
    payload jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now(),
    primary key (user_id, document_type)
);

alter table public.user_documents enable row level security;

revoke all on table public.user_documents from anon;
grant select, insert, update, delete on table public.user_documents to authenticated;

drop policy if exists "users can read only their documents" on public.user_documents;
drop policy if exists "users can insert only their documents" on public.user_documents;
drop policy if exists "users can update only their documents" on public.user_documents;
drop policy if exists "users can delete only their documents" on public.user_documents;

create policy "users can read only their documents"
on public.user_documents for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert only their documents"
on public.user_documents for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update only their documents"
on public.user_documents for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete only their documents"
on public.user_documents for delete
to authenticated
using (auth.uid() = user_id);
