# Cart Service

Microservice quản lý giỏ hàng (PostgreSQL + Redis cache + RabbitMQ), gọi qua **API Gateway** tại prefix `/api/cart`.

## Kiến trúc

- **PostgreSQL** — source of truth (`carts`, `cart_items`)
- **Redis 7** — cache-aside (`cart:{userId}`)
- **product-service** — validate sản phẩm & tồn kho khi thêm/cập nhật
- **review-service** — (tuỳ chọn) `GET /internal/users/:id` khi `USER_VERIFY_ENABLED=true`
- **RabbitMQ** — publish `cart.item.added`, `cart.cleared`; consume `order.created` để tự xóa giỏ

## Chạy local

```bash
cd services/cart-service
cp .env.example .env
npm install
npm run start:dev
```

Mặc định port **3006**.

Yêu cầu: PostgreSQL, Redis, RabbitMQ (`docker compose up`), `JWT_SECRET` trùng auth-service, product-service chạy port 3002.

## API công khai (qua Gateway: `http://localhost:3000`)

Tất cả route yêu cầu header `Authorization: Bearer <accessToken>`.

| Method | Gateway path | Mô tả |
|--------|--------------|--------|
| GET | `/api/cart` | Lấy giỏ hàng |
| POST | `/api/cart/items` | Thêm/cộng số lượng (validate product + stock) |
| PATCH | `/api/cart/items/:itemId` | Cập nhật số lượng |
| DELETE | `/api/cart/items/:itemId` | Xóa một dòng |
| DELETE | `/api/cart` | Xóa toàn bộ item |
| GET | `/health` | Health check (trực tiếp service) |

## API nội bộ (service-to-service)

Header: `X-Internal-Api-Key: <INTERNAL_API_KEY>`

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `/internal/carts/:userId` | Order-service lấy giỏ trước checkout |
| DELETE | `/internal/carts/:userId` | Order-service xóa giỏ sau checkout |

## RabbitMQ events

| Routing key | Hướng | Payload |
|-------------|-------|---------|
| `cart.item.added` | Publish | `{ userId, productId, quantity, cartId }` |
| `cart.cleared` | Publish | `{ userId, cartId, reason }` |
| `order.created` | Consume | Tự động clear cart của user |
