-- Autosave writes (autosave_data/autosave_updated_at) must not bump candidate_form.updated_at,
-- otherwise: (1) the client can never tell an autosave-only write apart from a real manual
-- save when deciding whether to offer draft recovery, and (2) resolveFormProgressState()
-- in candidateAccountService.js compares updated_at against the application's submitted_at
-- to confirm an employee's completed status — a later autosave ping would desync that check
-- and could incorrectly revert a submitted employee form back to "in_progress".
CREATE OR REPLACE TRIGGER "trg_candidate_set_updated_at__candidate_form"
  BEFORE UPDATE ON "public"."candidate_form"
  FOR EACH ROW
  WHEN (
    (to_jsonb(OLD) - 'updated_at' - 'autosave_data' - 'autosave_updated_at')
    IS DISTINCT FROM
    (to_jsonb(NEW) - 'updated_at' - 'autosave_data' - 'autosave_updated_at')
  )
  EXECUTE FUNCTION "public"."set_updated_at"();
