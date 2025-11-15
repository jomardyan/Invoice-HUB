import 'tsconfig-paths/register';
import App from './app';

const application = new App();

application.start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} signal received: starting graceful shutdown`);
  try {
    await application.stop();
    console.log('Application shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
