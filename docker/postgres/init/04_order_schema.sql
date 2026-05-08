-- Order service schema (runs against consolidated bakery_db)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'PENDING', 'CONFIRMED', 'BAKING', 'READY', 'COMPLETED', 'CANCELLED'
    );
  END IF;
END
$$;
 
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL,
  status           order_status DEFAULT 'PENDING',
  total_amount     DECIMAL(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  note             TEXT,
  cancelled_reason TEXT,
  cancelled_by     VARCHAR(50),
  confirmed_at     TIMESTAMP,
  completed_at     TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);
 
CREATE TABLE order_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL,
  product_name   VARCHAR(255) NOT NULL,   -- snapshot
  product_price  DECIMAL(10,2) NOT NULL,  -- snapshot
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  subtotal       DECIMAL(10,2) NOT NULL
);
 
CREATE TABLE order_status_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status   order_status NOT NULL,
  changed_by  UUID,
  actor_role  VARCHAR(20),
  note        TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
 
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);