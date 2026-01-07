// src/app/middlewares/admin_only.js
export default function adminOnly(req, res, next) {
  const email = req.user?.email?.toLowerCase?.() || "";
  if (email === "admin@gmail.com") return next();
  return res.status(403).json({ success: false, error: "Admin only" });
}
