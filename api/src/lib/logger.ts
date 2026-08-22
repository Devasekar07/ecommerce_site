type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

const sensitiveKeyPattern = /(authorization|cookie|password|secret|token|api[_-]?key|private|credential)/i;

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[MaxDepth]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((safe, [key, entry]) => {
      safe[key] = sensitiveKeyPattern.test(key) ? "[Redacted]" : sanitize(entry, depth + 1);
      return safe;
    }, {});
  }

  return value;
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  const safeContext = sanitize(context) as LogContext;
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...safeContext
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV !== "production") {
      write("debug", message, context);
    }
  },
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context)
};
