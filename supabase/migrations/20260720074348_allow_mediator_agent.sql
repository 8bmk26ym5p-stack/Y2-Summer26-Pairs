/*
# Allow "mediator" as a valid agent value

1. Modified Tables
- `messages`
  - The `agent` column CHECK constraint previously only allowed 'bahaa' and 'yousef'.
  - A third agent ("The Mediator", a neutral moderator) has been added to the app.
  - This migration drops the old constraint and creates a new one that also allows 'mediator'.

2. Security
- No RLS or policy changes. Existing anon/authenticated CRUD policies remain unchanged.

3. Notes
- Non-destructive: only widens the allowed values. No data is lost or rewritten.
- Safe to re-run: uses DROP IF EXISTS before recreating the constraint.
*/

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_agent_check;

ALTER TABLE messages
  ADD CONSTRAINT messages_agent_check
  CHECK (agent IN ('bahaa', 'yousef', 'mediator'));
