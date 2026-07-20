/*
# Create messages table for AI Presidential Debate chat history

## Purpose
Stores the conversation history between users and the two AI presidential
candidate agents (Bahaa the Democrat and Yousef the Republican). Each row is
one message in one conversation. Conversations are keyed by a client-generated
session_id (uuid) so a visitor can continue a conversation across page reloads
without needing to sign in.

## New Tables
- `messages`
  - `id` (uuid, primary key, default gen_random_uuid())
  - `session_id` (uuid, not null) — groups all messages in one conversation
  - `agent` (text, not null) — which candidate: 'bahaa' | 'yousef'
  - `role` (text, not null) — 'user' | 'assistant'
  - `content` (text, not null) — the message text
  - `created_at` (timestamptz, default now())

## Indexes
- `idx_messages_session_created` on (session_id, created_at) so loading a
  conversation's history is a fast ordered scan.

## Security — Row Level Security
- RLS enabled on `messages`.
- This is a single-tenant, no-auth app: any visitor can create a session and
  read/write its messages. Policies therefore use `TO anon, authenticated` with
  `USING (true)` / `WITH CHECK (true)` because the data is intentionally public
  within the app (there is no per-user ownership concept).
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  agent text NOT NULL CHECK (agent IN ('bahaa', 'yousef')),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_created
  ON messages (session_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages"
  ON messages FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages"
  ON messages FOR DELETE
  TO anon, authenticated
  USING (true);
