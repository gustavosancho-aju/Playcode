import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  AGENT_TIMEOUT: parseInt(process.env.AGENT_TIMEOUT || '120000', 10),
  AGENT_RETRIES: parseInt(process.env.AGENT_RETRIES || '1', 10),
  CLAUDE_REMOTE_URL: process.env.CLAUDE_REMOTE_URL || '',
};
