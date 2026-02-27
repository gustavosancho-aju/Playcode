import winston from 'winston';
import { env } from '../config/env';

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}] ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

export { logger };
