-- docker/postgres/init/08_seed_data.sql

-- =========================================================
-- USERS
-- Passwords:
-- Admin@123
-- admin
-- bcrypt rounds = 12
-- =========================================================

INSERT INTO users (
    email,
    password,
    full_name,
    phone,
    role,
    avatar_url
)
VALUES

(
    'admin@bakery.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN3f.6fKqfmGYPqHkTkCC',
    'Admin Bakery',
    '0900000001',
    'ADMIN',
    'https://i.pravatar.cc/300?img=1'
),

(
    'baker@bakery.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN3f.6fKqfmGYPqHkTkCC',
    'Baker John',
    '0900000002',
    'BAKER',
    'https://i.pravatar.cc/300?img=2'
),

(
    'customer@test.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN3f.6fKqfmGYPqHkTkCC',
    'Customer Test',
    '0900000003',
    'CUSTOMER',
    'https://i.pravatar.cc/300?img=3'
),

(
    'admin@test.com',
    '$2b$12$8w0LQ9t2M1mM2v9J6Jz8Yu6q2Qw5V7n5z7l6V9uY8fW8sQx0l5K2e',
    'Test Admin',
    '0900000999',
    'ADMIN',
    'https://i.pravatar.cc/300?img=10'
),

(
    'admin@legacy.local',
    '$2a$10$j3htn0wSXoZM/oMbaWhqH.7TFbbmGSveXF3wuj4HpYPore1FHJGaK',
    'Legacy Admin',
    NULL,
    'EMPLOYEE',
    'https://i.pravatar.cc/300?img=11'
);

-- =========================================================
-- CARTS
-- =========================================================

INSERT INTO carts (user_id)
SELECT id
FROM users
WHERE role = 'CUSTOMER';

-- =========================================================
-- CART ITEMS
-- =========================================================

INSERT INTO cart_items (
    cart_id,
    product_id,
    quantity
)
SELECT
    c.id,
    p.id,
    2
FROM carts c
JOIN users u ON c.user_id = u.id
JOIN products p ON p.slug = 'p027'
WHERE u.email = 'customer@test.com';

-- =========================================================
-- ORDERS
-- =========================================================

INSERT INTO orders (
    user_id,
    status,
    total_amount,
    shipping_address,
    note
)
SELECT
    u.id,
    'READY',
    335000,
    '{
      "receiver": "Customer Test",
      "phone": "0900000003",
      "address": "Ho Chi Minh City"
    }'::jsonb,
    'Please write Happy Birthday'
FROM users u
WHERE u.email = 'customer@test.com';

-- =========================================================
-- ORDER ITEMS
-- =========================================================

INSERT INTO order_items (
    order_id,
    product_id,
    product_name,
    product_price,
    quantity,
    subtotal
)
SELECT
    o.id,
    p.id,
    p.name,
    p.price,
    1,
    p.price
FROM orders o
JOIN products p ON p.slug = 'p002'
LIMIT 1;

-- =========================================================
-- PAYMENTS
-- =========================================================

INSERT INTO payments (
    order_id,
    user_id,
    amount,
    method,
    status,
    transaction_id,
    provider_data,
    paid_at
)
SELECT
    o.id,
    o.user_id,
    o.total_amount,
    'VNPAY',
    'SUCCESS',
    'TXN_123456',
    '{"source":"legacy-orders","mappedStatus":"COMPLETED"}'::jsonb,
    NOW()
FROM orders o
LIMIT 1;

-- =========================================================
-- REVIEWS
-- =========================================================

INSERT INTO reviews (
    user_id,
    product_id,
    order_id,
    rating,
    comment,
    images
)
SELECT
    u.id,
    p.id,
    o.id,
    5,
    'Bánh rất ngon và đẹp!',
    ARRAY[
        'https://res.cloudinary.com/dektqvylq/image/upload/v1764240276/tiramisu_cake_16a01603c84a4217826a59da6c6f6cfd_master_kztodj.jpg'
    ]
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN products p ON p.slug = 'p002'
WHERE u.email = 'customer@test.com'
LIMIT 1;

-- =========================================================
-- WISHLISTS
-- =========================================================

DO $$
BEGIN
    IF to_regclass('public.wishlists') IS NOT NULL THEN
        INSERT INTO wishlists (
            user_id,
            product_id
        )
        SELECT
            u.id,
            p.id
        FROM users u
        JOIN products p ON p.slug = 'p005'
        WHERE u.email = 'customer@test.com';
    END IF;
END
$$;