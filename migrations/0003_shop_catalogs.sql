CREATE TABLE IF NOT EXISTS workspace_shop_products (
  shop_id TEXT NOT NULL REFERENCES storefront_workspaces(id),
  product_id TEXT NOT NULL,
  document TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (shop_id, product_id)
);
CREATE INDEX IF NOT EXISTS workspace_shop_product_order ON workspace_shop_products(shop_id, position, product_id);
CREATE TABLE IF NOT EXISTS workspace_shop_appearance (
  shop_id TEXT PRIMARY KEY REFERENCES storefront_workspaces(id),
  document TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_shop_media (
  id TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL REFERENCES storefront_workspaces(id) ON DELETE CASCADE,
  data BLOB NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_whatsapp_bindings (
  shop_id TEXT PRIMARY KEY REFERENCES storefront_workspaces(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL UNIQUE
);
