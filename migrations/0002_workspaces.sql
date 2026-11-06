CREATE TABLE IF NOT EXISTS workspace_owners (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workspace_invites (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires INTEGER NOT NULL,
  claimed_by TEXT REFERENCES workspace_owners(id)
);
CREATE TABLE IF NOT EXISTS workspace_sessions (
  token_hash TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES workspace_owners(id),
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS storefront_workspaces (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES workspace_owners(id),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1))
);
CREATE INDEX IF NOT EXISTS storefront_workspaces_owner ON storefront_workspaces(owner_id, slug);
CREATE INDEX IF NOT EXISTS workspace_sessions_expiry ON workspace_sessions(expires);
CREATE INDEX IF NOT EXISTS workspace_invites_expiry ON workspace_invites(expires);
