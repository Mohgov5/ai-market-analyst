// server/src/utils/logger.ts
import winston from 'winston';

// Configure le format des logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(
    ({ level, message, timestamp, moduleName, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] ${moduleName ? `[${moduleName}]` : ''}: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    }
  )
);

// Crée une instance de logger avec un nom de module
export const createLogger = (moduleName: string) => {
  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    defaultMeta: { moduleName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          logFormat
        ),
      }),
      // En production, ajoutez des transports pour fichiers
      ...(process.env.NODE_ENV === 'production'
        ? [
            new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
            new winston.transports.File({ filename: 'logs/combined.log' })
          ]
        : [])
    ],
  });
};

// Logger par défaut pour une utilisation générale
export const logger = createLogger('App');

// Middleware pour logger les requêtes HTTP
export const httpLogger = (req: any, res: any, next: any) => {
  // Log la requête
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Log la réponse
  const originalSend = res.send;
  res.send = function (body: any) {
    logger.info(`Response ${res.statusCode}`, {
      statusCode: res.statusCode,
      responseTime: Date.now() - req._startTime,
    });
    return originalSend.call(this, body);
  };

  // Capture le temps de début pour calculer le temps de réponse
  req._startTime = Date.now();
  next();
};

// Gestionnaire d'erreurs non captées
export const setupGlobalErrorHandling = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
  });
};