import logger from '../config/logger.js';
import { Server } from 'http';
import { Socket } from 'net';

interface SetupOptions {
  server: Server;
  sockets: Set<Socket>;
  dbConnection: ClosableConnection;
  JobScheduler?: JobSchedulerLike;
}

interface ShutdownOptions {
  timeoutMs?: number;
}

interface ClosableConnection {
  close: () => Promise<void>;
}

interface JobSchedulerLike {
  stopAllJobs?: () => Promise<unknown>;
}

interface FlushableTransport {
  flush?: () => void;
}

const isFlushableTransport = (value: unknown): value is FlushableTransport =>
  typeof value === 'object' && value !== null;

export default function setupGracefulShutdown({
  server,
  sockets,
  dbConnection,
  JobScheduler,
}: SetupOptions): void {
  let shuttingDown = false;

  async function gracefulShutdown(
    reason: string,
    { timeoutMs = 30000 }: ShutdownOptions = {}
  ): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`Graceful shutdown initiated: ${reason}`);

    const tasks: Promise<unknown>[] = [];

    // 1) Stop accepting new HTTP connections
    tasks.push(
      new Promise(resolve => {
        server.close(err => {
          if (err) logger.error('Error closing HTTP server', err);
          else logger.info('HTTP server closed');
          resolve(undefined);
        });
      })
    );

    // 1a) Destroy open sockets after 5 seconds
    tasks.push(
      new Promise(resolve => {
        setTimeout(() => {
          for (const socket of sockets) {
            try {
              socket.destroy();
            } catch (_) {
              continue;
            }
          }
          resolve(undefined);
        }, 5000);
      })
    );

    // 2) Stop background jobs (best-effort)
    try {
      if (JobScheduler?.stopAllJobs) {
        tasks.push(
          JobScheduler.stopAllJobs().catch((err: unknown) =>
            logger.error('Error stopping all jobs', err)
          )
        );
      }
    } catch (e) {
      logger.error('Exception stopping jobs', e);
    }

    // 3) Close DB pool
    try {
      tasks.push(
        dbConnection
          .close()
          .then(() => logger.info('Sequelize connection closed'))
          .catch((err: unknown) =>
            logger.error('Error closing Sequelize connection', err)
          )
      );
    } catch (e) {
      logger.error('Exception closing Sequelize connection', e);
    }

    // 4) Flush logger transports (best-effort)
    tasks.push(
      new Promise(resolve => {
        try {
          const rawTransports: unknown = logger.transports;
          const transports = Array.isArray(rawTransports)
            ? rawTransports
            : Object.values(rawTransports || {});
          transports.forEach(transport => {
            if (isFlushableTransport(transport)) {
              transport.flush?.();
            }
          });
          setTimeout(resolve, 500);
        } catch (_) {
          resolve(undefined);
        }
      })
    );

    const deadline = new Promise(resolve =>
      setTimeout(resolve, timeoutMs, 'timeout')
    );
    await Promise.race([Promise.allSettled(tasks), deadline]);

    logger.info('Shutdown complete, exiting process');
    process.exit(0);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', err => {
    logger.error('Uncaught exception', err);
    gracefulShutdown('uncaughtException', { timeoutMs: 10000 });
  });
  process.on('unhandledRejection', reason => {
    logger.error('Unhandled promise rejection', reason);
    gracefulShutdown('unhandledRejection', { timeoutMs: 10000 });
  });
}
