-- Queue tabs are views over status (CONTEXT.md); expose it as a generated
-- column with an index so a real backend could serve the tabs without
-- unpacking every document.
alter table decisions
  add column status text generated always as (body->>'status') stored;

create index decisions_status_idx on decisions (status);
