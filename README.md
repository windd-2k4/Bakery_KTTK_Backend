# Sweet Bakery - Microservices Architecture

Dự án Sweet Bakery được xây dựng trên nền tảng Microservices sử dụng NestJS cho Backend, React (Vite) cho Frontend, và API Gateway để điều phối các request.

## 🚀 Hướng dẫn cài đặt và chạy dự án

### 1. Khởi động Cơ sở dữ liệu (PostgreSQL qua Docker)
Trước khi chạy bất kỳ service nào, hãy đảm bảo Database đã được khởi tạo:
```bash
cd Bakery_Backend/docker
docker-compose up -d
```

### 2. Khởi chạy Backend Services
Mở các terminal riêng biệt cho API Gateway và từng Microservice cần thiết.

**Chạy API Gateway (Bắt buộc - Port 3000):**
```bash
cd Bakery_Backend/api-gateway
npm install
npm run dev
```

**Chạy Auth Service (Port 3001):**
```bash
cd Bakery_Backend/services/auth-service
npm install
npm run start:dev
```
*(Lặp lại tương tự cho các service khác như: `cart-service`, `product-service`, v.v. nếu cần thiết)*

### 3. Khởi chạy Frontend (React Vite)
Mở một terminal mới cho Frontend:
```bash
cd SWEETBAKERY_FRONTEND
npm install
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

---

## 🏗️ Kiến trúc dự án (Microservices)

Hệ thống được chia nhỏ thành các dịch vụ độc lập, giao tiếp với nhau và với Frontend thông qua API Gateway.

- **Frontend (React/Vite)**: Chạy ở port `5173`. Chỉ giao tiếp duy nhất với API Gateway, không gọi trực tiếp các service con.
- **API Gateway (Express/http-proxy-middleware)**: Chạy ở port `3000`. Đóng vai trò là cửa ngõ (Reverse Proxy), nhận request từ Frontend và phân luồng (Routing) tới đúng service con. Đồng thời xử lý CORS tập trung.
- **Microservices (NestJS)**:
  - `auth-service` (Port `3001`): Quản lý đăng nhập, đăng ký, xác thực JWT, refresh token.
  - `cart-service`, `product-service`, `order-service`,...: Đảm nhận các nghiệp vụ tương ứng.
- **Database (PostgreSQL)**: Được chứa trong Docker, gồm cấu trúc bảng tổng hợp cho tất cả các service.

**Luồng dữ liệu mẫu (Đăng nhập):**
`Frontend (5173)` ➔ `POST /auth-management/api/v1/auth/log-in` ➔ `API Gateway (3000)` ➔ (Proxy đổi path thành `/auth/login`) ➔ `Auth Service (3001)` ➔ `Database`.

---

## ⚠️ Lưu ý khi tích hợp Frontend (React)

Để hệ thống Frontend kết nối mượt mà với Microservices Backend, hãy chú ý các điểm sau:

1. **Cấu hình API Base URL**:
   Toàn bộ request từ Frontend phải hướng tới **API Gateway** (`http://localhost:3000`), KHÔNG trỏ trực tiếp tới các service con (như 3001, 3002).
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. **Xử lý Response Interceptor (Double Unwrapping)**:
   Backend NestJS trả về chuẩn ApiResponse dạng: `{ code: 200, message: "...", data: { ... } }`.
   Nếu dùng `axiosClient.interceptors.response.use` tự động trả về `response.data`, thì trong các Component **không được gọi `.data` thêm một lần nữa** để tránh lỗi `undefined` hoặc `Double Unwrapping`.

3. **Cơ chế Refresh Token**:
   `axiosClient` bắt lỗi `401 Unauthorized` để tự động dùng Refresh Token gọi API `/refresh` lấy Access Token mới.
   **Lưu ý:** Cần bỏ qua (exclude) các endpoint như `/log-in` khỏi logic tự động refresh để tránh sinh ra lỗi `400 Bad Request` không đáng có khi người dùng gõ sai mật khẩu.

4. **Đồng bộ hóa tên trường (Field Mapping)**:
   Các API Backend hiện tại đang sử dụng định dạng JSON CamelCase (VD: `firstName`, `lastName`). Đảm bảo `payload` đẩy lên từ Frontend trùng khớp chính xác với DTO mà Backend yêu cầu. Đảm bảo Entity khai báo rõ tên trường thực tế trong Database (ví dụ `@Column({ name: 'is_active' })`).
