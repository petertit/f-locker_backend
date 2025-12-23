import jwt from "jsonwebtoken";

export default function authUser(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload: { sub: userId, email, iat, exp }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid/Expired token" });
  }
}
