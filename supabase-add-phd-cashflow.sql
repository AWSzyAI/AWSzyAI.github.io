-- Allow the PhD cash-flow planner to keep its own cloud document.
-- Safe for existing money, tax, and device rows: only the allowed value list changes.
alter table public.user_documents
    drop constraint if exists user_documents_document_type_check;

alter table public.user_documents
    add constraint user_documents_document_type_check
    check (document_type in ('money', 'tax', 'device', 'phd-cashflow'));
