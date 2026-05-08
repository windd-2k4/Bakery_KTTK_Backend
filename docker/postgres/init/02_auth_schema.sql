-- Auth service schema (runs against consolidated bakery_db)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  phone         VARCHAR(20),
  role          VARCHAR(20) DEFAULT 'CUSTOMER'
                CHECK (role IN ('CUSTOMER', 'ADMIN', 'BAKER', 'EMPLOYEE')),
  is_active     BOOLEAN DEFAULT true,
  refresh_token TEXT,
  avatar_url    VARCHAR(500),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);
 
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
 
-- Trigger tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();