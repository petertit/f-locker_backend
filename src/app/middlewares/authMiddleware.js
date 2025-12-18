// server/src/app/middlewares/authMiddleware.js
// Bạn chưa dùng token/jwt nên middleware này tạm để trống.
// Sau này nếu dùng JWT, bạn sẽ verify ở đây.
export default function authMiddleware(req, res, next) {
  return next();
}
