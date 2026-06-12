-- Persistence port tables. A Decision travels as one document (the port
-- speaks whole Decisions), so the row is id + jsonb body. meta carries the
-- seed version stamp the nuke-and-reseed contract checks on load.
create table decisions (
  id text primary key,
  body jsonb not null
);

create table meta (
  key text primary key,
  value text not null
);
