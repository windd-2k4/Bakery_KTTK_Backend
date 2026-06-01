-- Enforce table ownership boundaries for each microservice role.
-- This keeps services isolated even when they share a single PostgreSQL database.

DO
$$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'auth_service_user') THEN
        CREATE ROLE auth_service_user LOGIN PASSWORD 'auth_service_pass';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'product_service_user') THEN
        CREATE ROLE product_service_user LOGIN PASSWORD 'product_service_pass';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cart_service_user') THEN
        CREATE ROLE cart_service_user LOGIN PASSWORD 'cart_service_pass';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'order_service_user') THEN
        CREATE ROLE order_service_user LOGIN PASSWORD 'order_service_pass';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'payment_service_user') THEN
        CREATE ROLE payment_service_user LOGIN PASSWORD 'payment_service_pass';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'review_service_user') THEN
        CREATE ROLE review_service_user LOGIN PASSWORD 'review_service_pass';
    END IF;
END
$$;

-- Start from least privilege.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

-- All service roles can resolve objects in schema public.
GRANT USAGE ON SCHEMA public TO bakery_user;
GRANT USAGE ON SCHEMA public TO auth_service_user;
GRANT USAGE ON SCHEMA public TO product_service_user;
GRANT USAGE ON SCHEMA public TO cart_service_user;
GRANT USAGE ON SCHEMA public TO order_service_user;
GRANT USAGE ON SCHEMA public TO payment_service_user;
GRANT USAGE ON SCHEMA public TO review_service_user;

-- Auth service: users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO auth_service_user;

-- Product service: categories, products
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO bakery_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO bakery_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories TO product_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO product_service_user;

-- Compatibility layer: legacy pastry tables used by the NestJS compatibility API.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_pastries TO bakery_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_pastry_category TO bakery_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_pastries TO product_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.legacy_pastry_category TO product_service_user;

-- Cart service: carts, cart_items
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.carts TO cart_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cart_items TO cart_service_user;

-- Order service: orders, order_items, order_status_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.orders TO order_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_items TO order_service_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_status_logs TO order_service_user;

-- Payment service: payments
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.payments TO payment_service_user;

-- Review service: reviews
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO review_service_user;
