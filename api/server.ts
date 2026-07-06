/**
 * local server entry file, for local development
 */
import app from './app.js';
import { startScheduler } from './services/scheduler.js';

/**
 * start server with port
 */
const PORT = Number(process.env.PORT) || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server ready on port ${PORT}`);
  
  startScheduler();
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;