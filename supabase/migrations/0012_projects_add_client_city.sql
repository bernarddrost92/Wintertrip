-- Privacy hotfix follow-up: a real client_city column so the frontend can
-- show the actual client city (never a guessed one) instead of the
-- LOCATIE ONBEKEND fallback or the "Gemeente X" name heuristic.
--
-- Additive and reversible: nullable, no default, no existing column
-- touched. Backfilling the 218 current production placements from the
-- original import source ("Stad klant") happens separately, once that
-- source data is available — this migration only adds the column.

alter table public.projects add column client_city text;
