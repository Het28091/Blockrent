/**
 * Simple structured logger for backend
 * Can be upgraded to Winston or Pino for production
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m', // Yellow
  INFO: '\x1b[36m', // Cyan
  DEBUG: '\x1b[90m', // Gray
  RESET: '\x1b[0m',
};

class Logger {
  constructor(module) {
    this.module = module;
    this.level = process.env.LOG_LEVEL || 'INFO';
  }

  _shouldLog(level) {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  _format(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level] || '';
    const reset = LOG_COLORS.RESET;

    const logObject = {
      timestamp,
      level,
      module: this.module,
      message,
      ...data,
    };

    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easy to parse)
      return JSON.stringify(logObject);
    } else {
      // Human-readable format for development
      const dataStr =
        Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
      return `${color}[${timestamp}] [${level}] [${this.module}]${reset} ${message}${dataStr}`;
    }
  }

  error(message, data = {}) {
    if (this._shouldLog('ERROR')) {
      console.error(this._format('ERROR', message, data));
    }
  }

  warn(message, data = {}) {
    if (this._shouldLog('WARN')) {
      console.warn(this._format('WARN', message, data));
    }
  }

  info(message, data = {}) {
    if (this._shouldLog('INFO')) {
      console.log(this._format('INFO', message, data));
    }
  }

  debug(message, data = {}) {
    if (this._shouldLog('DEBUG')) {
      console.log(this._format('DEBUG', message, data));
    }
  }

  // Middleware for Express
  static requestLogger(moduleName = 'HTTP') {
    const logger = new Logger(moduleName);

    return (req, res, next) => {
      const start = Date.now();

      // Log request
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });

      // Log response
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
        };

        if (res.statusCode >= 500) {
          logger.error('Request failed', logData);
        } else if (res.statusCode >= 400) {
          logger.warn('Client error', logData);
        } else {
          logger.info('Request completed', logData);
        }
      });

      next();
    };
  }
}

// Factory function
function createLogger(module) {
  return new Logger(module);
}

module.exports = { Logger, createLogger, LOG_LEVELS };
