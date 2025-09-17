# EV Rental Project – Server

Backend Node.js (ESM) với Express, Prisma (MongoDB), Vite client proxy-friendly, kèm cấu hình ESLint/Prettier/Nodemon.

## Yêu cầu

- Node.js >= 20.19 (khuyến nghị 22.12+)
- Vite >= 7
- npm hoặc pnpm
- (Tuỳ chọn) MongoDB cục bộ hoặc Mongo Atlas để dùng với Prisma

## Cài đặt

```bash
npm install
# hoặc
pnpm install
```

## Cấu hình môi trường

Tạo file `.env` ở thư mục `Server/`:

```env
NODE_ENV=development
PORT=3000
# Danh sách origin dev cho CORS, phân tách bởi dấu phẩy
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Kết nối MongoDB (Prisma, có thể để trống nếu chưa dùng DB)
DATABASE_URL="mongodb://localhost:27017/ev_rental?directConnection=true"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="15m"
COOKIE_NAME="access_token"
COOKIE_SECURE="false"
```

## Chạy phát triển

```bash
npm run dev
# server sẽ lắng nghe tại http://localhost:3000
```

Kiểm tra nhanh:

- `GET /health` → `{ "status": "ok" }`
- `GET /api/health` → `{ success, data: { status: 'ok' }, message, timestamp }`

## API Endpoints

### Document Upload API

#### Upload Document

```
POST /api/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- document: File (JPEG, PNG, JPG, PDF, max 10MB)
- documentType: "DRIVERS_LICENSE" | "ID_CARD" | "PASSPORT"
- documentNumber: string (optional)
- expiryDate: string (optional, ISO date format)
```

#### Get User Documents

```
GET /api/documents/my-documents
Authorization: Bearer <token>
```

#### Delete Document

```
DELETE /api/documents/:documentId
Authorization: Bearer <token>
```

#### Admin: Get All Documents

```
GET /api/documents/all?status=PENDING&documentType=ID_CARD&page=1&limit=20
Authorization: Bearer <token>
```

#### Admin: Verify Document

```
PATCH /api/documents/:documentId/verify
Authorization: Bearer <token>

Body:
{
  "status": "APPROVED" | "REJECTED",
  "rejectionReason": "string" (required if status is REJECTED)
}
```

## Build & Chạy sản phẩm

```bash
npm run build   # (dọn thư mục dist nếu cần)
npm start       # chạy sản phẩm
```

## Lint & Format

```bash
npm run lint         # Kiểm tra lint
npm run lint:fix     # Sửa lỗi lint
npm run prettier     # Kiểm tra format
npm run prettier:fix # Format tự động
```

## Cấu trúc thư mục

```
Server/
├─ src/
│  ├─ app.js                   # Khởi tạo Express app, middleware, mount /api
│  ├─ index.js                 # Entry ESM khởi động HTTP server
│  ├─ config/
│  │  ├─ env.js               # Biến môi trường (port, databaseUrl,...)
│  │  └─ cors.js              # Cấu hình CORS allow list
│  ├─ controllers/
│  │  ├─ health.controller.js # Trả response chuẩn hoá
│  │  └─ document.controller.js # Document upload/management
│  ├─ middleware/
│  │  ├─ errorHandler.js      # 404 & error handler
│  │  └─ authenticate.js      # JWT authentication
│  ├─ routes/
│  │  ├─ index.js             # Router gốc
│  │  └─ modules/
│  │     ├─ health.route.js
│  │     ├─ auth.route.js
│  │     ├─ booking.route.js
│  │     ├─ payment.route.js
│  │     └─ document.route.js # Document API routes
│  └─ lib/
│     └─ prisma.js            # PrismaClient singleton (ESM)
├─ prisma/
│  └─ schema.prisma           # Datasource MongoDB + generator client
├─ package.json               # type: module, scripts, deps
└─ ... cấu hình lint/format (eslint, prettier, nodemon)
```

## Ghi chú phát triển

- ESM (type: module): sử dụng `import/export` thay cho CommonJS.
- CORS: cấu hình allow-list trong `src/config/cors.js`, đọc từ `ALLOWED_ORIGINS`.
- Chuẩn hoá response: các API nên tuân theo định dạng `{ success, data, message, timestamp }`.
- Prisma (MongoDB): schema tối thiểu đã sẵn sàng; thêm model khi bắt đầu nghiệp vụ, sau đó `npx prisma generate`.
- Client (repo riêng): nên dùng Vite proxy để gọi `/api/...` bằng relative URL khi dev.
- File Storage: Documents được lưu trữ trong thư mục `uploads/` trên local filesystem.

## Liên quan

- Boilerplate tham khảo: `simple-vite-react-express` (React + Vite + Express + Prisma) – xem repo: `https://github.com/Avinava/simple-vite-react-express.git`

---

Nếu bạn cần cấu hình thêm (auth, logger, rate-limit, validation), chúng ta có thể bổ sung nhanh theo cùng phong cách cấu trúc ở trên.

## Tóm tắt

Tôi đã tạo hoàn chỉnh API cho phép upload CMND và giấy phép lái xe với các tính năng:

### ✅ **Đã hoàn thành:**

### ✅ **Đã hoàn thành:**

1. **Local File Storage** - Lưu trữ file an toàn trong hệ thống local
2. **Document Controller** - Xử lý upload, get, delete, verify documents
3. **Document Routes** - API endpoints cho user và admin
4. **File Validation** - Kiểm tra loại file, kích thước
5. **Database Integration** - Lưu thông tin documents vào MongoDB
6. **Authentication** - Bảo mật API với JWT
7. **Admin Features** - Verify/reject documents

### **API Endpoints:**

- `POST /api/documents/upload` - Upload CMND/License
- `GET /api/documents/my-documents` - Xem documents của user
- `DELETE /api/documents/:id` - Xóa document
- `GET /api/documents/all` - Admin xem tất cả documents
- `PATCH /api/documents/:id/verify` - Admin verify/reject

### **Cần thiết lập:**

1. **Database Migration** - Chạy `npx prisma db push`
2. **Environment Variables** - Cấu hình JWT và database keys
3. **Uploads Directory** - Thư mục `uploads/documents/` sẽ được tạo tự động

Bạn có muốn tôi hướng dẫn thiết lập database hoặc test API không?
