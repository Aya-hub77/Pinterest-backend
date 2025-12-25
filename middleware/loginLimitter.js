import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";

const redisClient = new Redis();

export const loginLimiter = rateLimit({
  store: new RedisStore({sendCommand:(...args) =>redisClient.call(...args),}),
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      errors: [{ msg: "Too many login attempts from this IP, please try again later.", },],
    });
  },
});