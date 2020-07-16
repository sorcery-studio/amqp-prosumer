import { Command } from "commander";
import { debug } from "debug";

export type CommandFactoryFn = (name?: string | undefined) => Command;

const log = debug("amqp-prosumer:shutdown");

export function reportErrorAndExit(err: Error): never {
  // eslint-disable-next-line no-console
  console.error("ERROR:", err.message, err.stack);
  process.exit(1);
}

export function registerShutdownHandler(handler: () => Promise<void>): void {
  (async (): Promise<void> => {
    // Each registered handler as its own state
    let isShuttingDown = false;

    const shutdown = async (): Promise<void> => {
      if (isShuttingDown) {
        log("The command is already shutting down");
        return;
      }

      isShuttingDown = true;

      log("Running shutdown handler");
      await handler();
      log("Shutdown handler complete");
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", shutdown);
    process.on("unhandledRejection", shutdown);
  })();
}
