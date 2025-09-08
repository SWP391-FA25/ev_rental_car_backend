# EV Rental Project – Server

Backend Node.js (ESM) với Express, Prisma (MongoDB), Vite client proxy-friendly, kèm cấu hình ESLint/Prettier/Nodemon.

## Yêu cầu

- Node.js >= 20.19 (khuyến nghị 22.12+)
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
```

## Chạy phát triển

```bash
npm run dev
# server sẽ lắng nghe tại http://localhost:3000
```

Kiểm tra nhanh:

- `GET /health` → `{ "status": "ok" }`
- `GET /api/health` → `{ success, data: { status: 'ok' }, message, timestamp }`

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
│  │  └─ health.controller.js # Trả response chuẩn hoá
│  ├─ middleware/
│  │  └─ errorHandler.js      # 404 & error handler
│  ├─ routes/
│  │  ├─ index.js             # Router gốc
│  │  └─ modules/health.route.js
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

## Liên quan

- Boilerplate tham khảo: `simple-vite-react-express` (React + Vite + Express + Prisma) – xem repo: `https://github.com/Avinava/simple-vite-react-express.git`

---

Nếu bạn cần cấu hình thêm (auth, logger, rate-limit, validation), chúng ta có thể bổ sung nhanh theo cùng phong cách cấu trúc ở trên.
