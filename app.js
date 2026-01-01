import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import crypto from "crypto";
import router from "./routes/indexRoutes.js";
import errorHandler from "./middleware/errorHandler.js"
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';
const devFrontend = process.env.CLIENT_URL || 'http://localhost:5173';


app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", isDev ? devFrontend : "", isDev ? "http://localhost:5000" : ""].filter(Boolean),
        connectSrc: ["'self'", isDev ? devFrontend : ""].filter(Boolean),
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
      },
    },
    frameguard: { action: "deny" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    xContentTypeOptions: true,
    dnsPrefetchControl: { allow: false },
    expectCt: { maxAge: 86400, enforce: true },
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    xDownloadOptions: true,
  })
);
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

app.use((req, res, next) => {
  if (!req.cookies["XSRF-TOKEN"]) {
    const token = generateCsrfToken();
    res.setHeader('Set-Cookie', `XSRF-TOKEN=${token}; Path=/; HttpOnly; SameSite=None; Secure`);
  }
  next();
});

export function verifyCsrf(req, res, next) {
  const csrfCookie = req.cookies["XSRF-TOKEN"];
  const csrfHeader = req.header("X-CSRF-Token");

  if (!csrfCookie || !csrfHeader)
    return res.status(403).json({ message: "Missing CSRF token" });

  if (csrfCookie !== csrfHeader)
    return res.status(403).json({ message: "Invalid CSRF token" });

  next();
}

app.get("/csrf-token", (req, res) => {
  const token = req.cookies["XSRF-TOKEN"];
  res.json({ csrfToken: token });
});

app.use("/", router);
app.use('/uploads', express.static(join(__dirname, 'uploads')));
if (process.env.NODE_ENV === "production") {
  app.use(express.static(join(__dirname, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(join(__dirname, "../client/build", "index.html"));
  });
}
app.use(errorHandler);

export default app;