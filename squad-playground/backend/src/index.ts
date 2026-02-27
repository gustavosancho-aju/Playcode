import { createServer } from 'http';
import { app } from './server/express';
import { createSocketServer } from './server/socket';
import { createMockRouter } from './routes/mock';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = createServer(app);
const io = createSocketServer(server);

app.use(createMockRouter(io));

server.listen(env.PORT, '127.0.0.1', () => {
  logger.info(`Server running on http://127.0.0.1:${env.PORT}`);
});
