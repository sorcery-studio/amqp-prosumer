import { Command } from "commander";
import { debug } from "debug";

export type CommandFactoryFn = (name?: string | undefined) => Command;

const log = debug("amqp-prosumer:shutdown");

export function reportErrorAndExit(err: Error): never {
  // eslint-disable-next-line no-console
  console.error("ERROR:", err.message, err.stack);
  process.exit(1);
}

export type ShutdownHandlerFn = () => Promise<void>;

export type RegisterShutdownHandlerFn = (handler: ShutdownHandlerFn) => void;

/**
 * Register a handler function which will be called for SIGINT/SIGTERM or on error conditions
 *
 * Some actions are long running and they need the SIGINT/SIGTERM signals to be sent
 * in order to get closed. This function helps in implementing this behaviour
 *
 * @param handler The function which should be executed upon supported event
 */
export const registerShutdownHandler: RegisterShutdownHandlerFn = (
  handler: ShutdownHandlerFn
) => {
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

    process.on("disconnect", shutdown);
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", shutdown);
    process.on("unhandledRejection", shutdown);
  })();
};
