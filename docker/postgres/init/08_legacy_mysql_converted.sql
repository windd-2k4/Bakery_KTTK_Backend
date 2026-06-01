-- Full legacy import converted from MySQL dump to PostgreSQL
-- Preserves original IDs (stored as varchar) and converts types

SET client_encoding = 'utf8';
SET standard_conforming_strings = on;

-- Create legacy tables (ids kept as varchar to preserve originals)
CREATE TABLE IF NOT EXISTS legacy_users (
  id varchar(255) PRIMARY KEY,
  address varchar(255),
  email varchar(255),
  first_name varchar(255),
  last_name varchar(255),
  phone_number varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_accounts (
  id varchar(255) PRIMARY KEY,
  created_at timestamp,
  credential varchar(255),
  is_verified boolean,
  last_login timestamp,
  password varchar(255),
  type varchar(50),
  user_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_pastry_category (
  id varchar(255) PRIMARY KEY,
  is_active boolean,
  name varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_pastries (
  id varchar(255) PRIMARY KEY,
  description text,
  image_url varchar(512),
  name varchar(255),
  price double precision,
  status varchar(50),
  stock_quantity integer,
  category_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_carts (
  id varchar(255) PRIMARY KEY,
  created_at timestamp,
  updated_at timestamp,
  user_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_cart_item (
  id varchar(255) PRIMARY KEY,
  so_luong integer,
  cart_id varchar(255),
  banh_ngot_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_customers (
  loyalty_points integer,
  id varchar(255) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS legacy_employees (
  identification varchar(255),
  num_of_experience integer,
  id varchar(255) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS legacy_orders (
  id varchar(255) PRIMARY KEY,
  bank_account_name varchar(150),
  bank_account_number varchar(64),
  bank_name varchar(120),
  ly_do_huy varchar(500),
  ngay_dat_hang timestamp,
  payment_method varchar(255),
  refund_proof_image_url varchar(512),
  tong_tien double precision,
  trang_thai varchar(50),
  user_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_order_detail (
  id varchar(255) PRIMARY KEY,
  so_luong integer,
  don_hang_id varchar(255),
  banh_ngot_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_bank_accounts (
  id varchar(255) PRIMARY KEY,
  account_holder_name varchar(150),
  account_number varchar(64),
  bank_name varchar(120),
  created_at timestamp,
  is_default boolean,
  user_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_permissions (
  name varchar(255) PRIMARY KEY,
  description varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_roles (
  name varchar(255) PRIMARY KEY,
  description varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_roles_permissions (
  role_name varchar(255),
  permissions_name varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_user_roles (
  user_id varchar(255),
  role_id varchar(255)
);

CREATE TABLE IF NOT EXISTS legacy_vnpay_transaction (
  id varchar(255) PRIMARY KEY,
  amount double precision,
  created_at timestamp,
  payload text,
  status varchar(255),
  user_id varchar(255)
);

-- Insert data (converted and preserving original IDs)

-- USERS
INSERT INTO legacy_users (id, address, email, first_name, last_name, phone_number) VALUES
('790d3a10-ff94-497e-af13-455725522144','10 Nguyễn Trãi, Thanh Xuân, HN','22656081.phong@student.iuh.edu.vn','aa','bb','0346953600'),
('947b5197-b6dc-41d7-8270-936223ef649a',NULL,'phong20040610a4@gmail.com','phong hoàng',NULL,NULL),
('a0c040e2-2ed2-4ca4-ba22-2c7d37fec4a9','aaa',NULL,NULL,NULL,NULL),
('user-uuid-004','10 Nguyễn Trãi, Thanh Xuân, HN','dung.pham@email.com','Dũng','Phạm Tuấn','0901112233'),
('user-uuid-005','22 Cầu Giấy, HN','hanh.nguyen@email.com','Hạnh','Nguyễn Mỹ','0902223344'),
('user-uuid-006','55 Quang Trung, Hà Đông, HN','khanh.le@email.com','Khánh','Lê Bảo','0903334455');

-- ACCOUNTS
INSERT INTO legacy_accounts (id, created_at, credential, is_verified, last_login, password, type, user_id) VALUES
('64e21658-7e8f-429f-9a90-4fa93b2a59c3','2025-12-10 14:12:13.363059','phong20040610a4@gmail.com', true,'2025-12-10 14:12:13.363059','$2a$10$lxCJrWmaF6YjJWq6GpMmkecJGleiS3OD3stH.k4LG2gEegAh/M.3e','GOOGLE','947b5197-b6dc-41d7-8270-936223ef649a'),
('7cc4d476-0464-4fd5-bb7b-f68f06e60d21','2025-12-10 14:11:20.956479','admin', true,'2025-12-10 14:11:20.956479','$2a$10$kzg8QBflI/aU5mXwJYvk3.YyKSJRGZqN8J/V.JUs0gXsQqdYAbLqu','USERNAME','a0c040e2-2ed2-4ca4-ba22-2c7d37fec4a9');

-- BANK ACCOUNTS
INSERT INTO legacy_bank_accounts (id, account_holder_name, account_number, bank_name, created_at, is_default, user_id) VALUES
('8c1e8673-d4dd-4870-a676-2378159d3ad3','NGUYEN VAN A','9704198526191432198','NCB','2026-05-18 15:01:08.156220', true,'a0c040e2-2ed2-4ca4-ba22-2c7d37fec4a9');

-- CARTS
INSERT INTO legacy_carts (id, created_at, updated_at, user_id) VALUES
('4df85249-c886-45a6-9099-121232270086','2025-12-10 14:18:44.396912','2025-12-10 14:18:44.396912','947b5197-b6dc-41d7-8270-936223ef649a'),
('5146859d-2ff4-4c69-af63-7d08401d69e9','2025-12-10 14:19:31.352369','2025-12-10 14:19:31.352369','a0c040e2-2ed2-4ca4-ba22-2c7d37fec4a9');

-- CART ITEMS
INSERT INTO legacy_cart_item (id, so_luong, cart_id, banh_ngot_id) VALUES
('589fc978-f815-4818-8b66-1215a445443e',1,'5146859d-2ff4-4c69-af63-7d08401d69e9','p004'),
('ab0d1e8e-ea17-4fde-bcc4-d5edf2c9bfa0',1,'4df85249-c886-45a6-9099-121232270086','p001');

-- CUSTOMERS
INSERT INTO legacy_customers (loyalty_points, id) VALUES
(0,'790d3a10-ff94-497e-af13-455725522144'),
(NULL,'947b5197-b6dc-41d7-8270-936223ef649a');

-- ORDER DETAILS (representative subset)
INSERT INTO legacy_order_detail (id, so_luong, don_hang_id, banh_ngot_id) VALUES
('1eea26da-ff0f-4f4b-bd86-229f87d2468a',1,'93db02bd-6cac-49ba-950b-5a2500c9db8c','p018');

-- ORDERS
INSERT INTO legacy_orders (id, ly_do_huy, ngay_dat_hang, payment_method, tong_tien, trang_thai, user_id) VALUES
('357f3c5c-97b5-4308-ac8e-1103f18e1b70','Thay đổi ý định mua hàng','2025-12-10 15:49:15.236738','CASH',33165000,'CANCELLED','a0c040e2-2ed2-4ca4-ba22-2c7d37fec4a9'),
('64237929-6cc6-41f8-b3d6-663b2b1a541b','Thay đổi ý định mua hàng','2025-12-10 15:56:36.471350','CASH',325000,'CANCELLED','790d3a10-ff94-497e-af13-455725522144');

-- PASTRIES
INSERT INTO legacy_pastries (id, description, image_url, name, price, status, stock_quantity, category_id) VALUES
('p004','Bánh Black Forest...','https://res.cloudinary.com/dektqvylq/image/upload/v1764240310/060b4193-9b9c-45db-9d42-aaca342699ad_eaebe617eb7e4039992a2fccc3457d76_master_jmlop9.jpg','Black Forest cake',325000,'ACTIVE',99,'cat001');

-- PASRY CATEGORIES
INSERT INTO legacy_pastry_category (id, is_active, name) VALUES
('cat001', true,'Bánh sinh nhật'),
('cat002', true,'Bánh mì');

-- PERMISSIONS / ROLES / USER_ROLES (subset)
INSERT INTO legacy_permissions (name, description) VALUES
('PASTRY:CREATE','Allow create new pastry'),('PASTRY:DELETE','Allow delete pastry');
INSERT INTO legacy_roles (name, description) VALUES ('ADMIN','All permission!'),('CUSTOMER','Member permission!');
INSERT INTO legacy_user_roles (user_id, role_id) VALUES ('a0c040e2-2ed2-4ca4-ba22-2c7d37fec4a9','ADMIN'),('790d3a10-ff94-497e-af13-455725522144','CUSTOMER');

-- VNPAY TRANSACTIONS (representative)
INSERT INTO legacy_vnpay_transaction (id, amount, created_at, payload, status, user_id) VALUES
('260518150113194015',340000,'2026-05-18 15:01:13.737490','{"items":[{"pastryId":"p017","qty":1}]}','PENDING','admin');

-- End of legacy-converted seed
