const { logSecurityEvent } = require("../utils/securityLogger");

const INTERNAL_HINT = /sql|ER_[A-Z_]+|ECONN|ENOENT|EACCES|Traceback|Unknown column|syntax error|at\s+\S+\s+\(/i;

function looksInternal(value) {
  if (value == null) return false;
  if (typeof value === "object") return true;
  return INTERNAL_HINT.test(String(value));
}

function stripInternalFields(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }

  const cleaned = { ...payload };
  delete cleaned.stack;
  delete cleaned.sql;
  delete cleaned.sqlMessage;
  delete cleaned.sqlState;
  delete cleaned.errno;

  if (looksInternal(cleaned.error)) {
    delete cleaned.error;
  }

  if (typeof cleaned.message === "string" && looksInternal(cleaned.message)) {
    cleaned.message = "Something went wrong. Please try again later.";
  }

  return cleaned;
}

function sanitizeResponses(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return originalJson(body);
    }

    const cleaned = stripInternalFields(body);

    if (res.statusCode >= 500) {
      delete cleaned.error;
      delete cleaned.stack;
      if (!cleaned.message || looksInternal(cleaned.message)) {
        cleaned.message = "Something went wrong. Please try again later.";
      }
    }

    return originalJson(cleaned);
  };

  next();
}

function notFoundHandler(req, res) {
  res.status(404).json({ message: "Not found" });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[${req.method} ${req.originalUrl}]`, err);

  const status = Number(err.status || err.statusCode) || 500;
  logSecurityEvent("SERVER_ERROR", { status }, req);

  const publicMessage =
    status >= 500 || looksInternal(err.message)
      ? "Something went wrong. Please try again later."
      : err.publicMessage || "Request could not be completed";

  res.status(status).json({
    success: false,
    message: publicMessage
  });
}

module.exports = {
  sanitizeResponses,
  notFoundHandler,
  errorHandler
};
