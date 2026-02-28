import { createServer } from 'http';
import { app } from './server/express';
import { createSocketServer } from './server/socket';
import { createMockRouter } from './routes/mock';
import { claudeRouter } from './routes/claude';
import { artifactsRouter } from './routes/artifacts';
import { sessionsRouter } from './routes/sessions';
import { memoryRouter } from './routes/memory';
import { createPipelineRouter } from './routes/pipeline';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = createServer(app);
const io = createSocketServer(server);

app.use(createMockRouter(io));
app.use(claudeRouter);
app.use(artifactsRouter);
app.use(sessionsRouter);
app.use(memoryRouter);
app.use(createPipelineRouter(io));

export { io };

server.listen(env.PORT, '127.0.0.1', () => {
  logger.info(`Server running on http://127.0.0.1:${env.PORT}`);
});
