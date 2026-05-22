# Cart Service

Microservice quản lý giỏ hàng (PostgreSQL + Redis cache), gọi qua **API Gateway** tại prefix `/api/cart`.

## Chạy local

```bash
cd services/cart-service
cp .env.example .env
npm install
npm run start:dev
```

Mặc định port **3006** (khớp `api-gateway` và `services.config.js`).

Yêu cầu: PostgreSQL (`docker compose up`), Redis, `JWT_SECRET` trùng auth-service.

## API (qua Gateway: `http://localhost:3000`)

Tất cả route yêu cầu header `Authorization: Bearer <accessToken>`.

| Method | Gateway path | Mô tả |
|--------|--------------|--------|
| GET | `/api/cart` | Lấy giỏ hàng |
| POST | `/api/cart/items` | Thêm/cộng số lượng sản phẩm |
| PATCH | `/api/cart/items/:itemId` | Cập nhật số lượng |
| DELETE | `/api/cart/items/:itemId` | Xóa một dòng |
| DELETE | `/api/cart` | Xóa toàn bộ item (sau checkout) |
| GET | `/health` | Health check (trực tiếp service) |

**Thêm sản phẩm:**

```json
POST /api/cart/items
{ "productId": "uuid", "quantity": 2 }
```

**Response chuẩn:**

```json
{
  "code": 200,
  "message": "Cart retrieved successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "items": [{ "id": "uuid", "productId": "uuid", "quantity": 2, "addedAt": "..." }],
    "itemCount": 2,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```
