-- Payment service schema (runs against consolidated bakery_db)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM ('VNPAY', 'MOMO', 'COD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED');
  END IF;
END
$$;
 
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID UNIQUE NOT NULL,
  user_id         UUID NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  method          payment_method NOT NULL,
  status          payment_status DEFAULT 'PENDING',
  transaction_id  VARCHAR(255),
  reference       VARCHAR(255),
  description     TEXT,
  response_code   VARCHAR(50),
  response_message TEXT,
  payment_url     TEXT,
  provider_data   JSONB,
  paid_at         TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);
 
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);