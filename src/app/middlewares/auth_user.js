// src/app/middlewares/auth_user.js
import jwt from "jsonwebtoken";

export default function authUser(req, res, next) {
  // ✅ để CORS preflight đi qua
  if (req.method === "OPTIONS") return res.sendStatus(204);

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload.sub = userId
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Invalid/Expired token" });
  }
}
