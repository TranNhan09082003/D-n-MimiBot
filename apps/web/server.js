// Startup file cho Phusion Passenger (cPanel Node.js App — Nhân Hòa).
// Passenger truyền cổng qua process.env.PORT; app phải tự listen trên đó.
// Chạy Next.js ở chế độ production (đã `npm run build` trước đó).
import { createServer } from 'node:http';
import next from 'next';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);
const hostname = process.env.HOST ?? '0.0.0.0';

const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res).catch((err) => {
        console.error('Lỗi xử lý request:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      });
    }).listen(port, () => {
      console.log(`Mimi web sẵn sàng trên cổng ${port}`);
    });
  })
  .catch((err) => {
    console.error('Không khởi động được Next.js:', err);
    process.exit(1);
  });
