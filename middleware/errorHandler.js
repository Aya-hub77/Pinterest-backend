export default function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  const response = {
    success: false,
    message: err.message || "Internal Server Error"
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  console.error(err.stack || err);
  res.status(statusCode).json(response);
}