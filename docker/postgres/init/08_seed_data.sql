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
-- CATEGORIES
-- =========================================================

INSERT INTO categories (
    name,
    slug,
    description,
    image_url
)
VALUES

(
    'Bánh Sinh Nhật',
    'birthday-cakes',
    'Các loại bánh kem sinh nhật cao cấp',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587'
),

(
    'Bánh Mì',
    'bread',
    'Bánh mì tươi mỗi ngày',
    'https://images.unsplash.com/photo-1509440159596-0249088772ff'
),

(
    'Bánh Ngọt',
    'sweet-cakes',
    'Cookies, mousse, tiramisu',
    'https://images.unsplash.com/photo-1486427944299-d1955d23e34d'
);

-- =========================================================
-- PRODUCTS
-- =========================================================

INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    price,
    stock,
    image_url,
    is_available,
    avg_rating,
    review_count
)
SELECT
    c.id,
    'Tiramisu Cake',
    'tiramisu-cake',
    'Bánh tiramisu kiểu Ý với mascarpone và cacao.',
    335000,
    10,
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9',
    true,
    4.8,
    12
FROM categories c
WHERE c.slug = 'birthday-cakes';

INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    price,
    stock,
    image_url,
    is_available,
    avg_rating,
    review_count
)
SELECT
    c.id,
    'Mango Mousse',
    'mango-mousse',
    'Bánh mousse xoài mát lạnh.',
    325000,
    15,
    'https://images.unsplash.com/photo-1551024601-bec78aea704b',
    true,
    4.6,
    8
FROM categories c
WHERE c.slug = 'birthday-cakes';

INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    price,
    stock,
    image_url,
    is_available,
    avg_rating,
    review_count
)
SELECT
    c.id,
    'Baguette',
    'baguette',
    'Bánh mì baguette kiểu Pháp.',
    15000,
    50,
    'https://images.unsplash.com/photo-1608198093002-ad4e005484ec',
    true,
    4.5,
    20
FROM categories c
WHERE c.slug = 'bread';

INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    price,
    stock,
    image_url,
    is_available,
    avg_rating,
    review_count
)
SELECT
    c.id,
    'Croissant',
    'croissant',
    'Croissant bơ nhiều lớp.',
    17000,
    40,
    'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e',
    true,
    4.7,
    15
FROM categories c
WHERE c.slug = 'bread';

INSERT INTO products (
    category_id,
    name,
    slug,
    description,
    price,
    stock,
    image_url,
    is_available,
    avg_rating,
    review_count
)
SELECT
    c.id,
    'Dark Chocolate Cookies',
    'dark-chocolate-cookies',
    'Cookies chocolate đậm vị cacao.',
    55000,
    100,
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e',
    true,
    4.9,
    30
FROM categories c
WHERE c.slug = 'sweet-cakes';

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
JOIN products p ON p.slug = 'croissant'
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
    352000,
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
JOIN products p ON p.slug = 'tiramisu-cake'
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
        'https://images.unsplash.com/photo-1551024601-bec78aea704b'
    ]
FROM users u
JOIN orders o ON o.user_id = u.id
JOIN products p ON p.slug = 'tiramisu-cake'
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
        JOIN products p ON p.slug = 'mango-mousse'
        WHERE u.email = 'customer@test.com';
    END IF;
END
$$;