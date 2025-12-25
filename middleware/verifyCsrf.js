export function verifyCsrf(req, res, next) {
  const csrfCookie = req.cookies["XSRF-TOKEN"];
  const csrfHeader = req.header("X-CSRF-Token");

  if (!csrfCookie || !csrfHeader)
    return res.status(403).json({ message: "Missing CSRF token" });

  if (csrfCookie !== csrfHeader)
    return res.status(403).json({ message: "Invalid CSRF token" });

  next();
}