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

function executeShutdown(shutdownFn: () => Promise<void>): () => void {
  return (): void => {
    shutdownFn().catch((err) =>
      console.error("Issue during execution of the shutdown function", err)
    );
  };
}

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
    const shutdown = async (): Promise<void> => {
      log("Running shutdown handler");
      await handler();
      log("Shutdown handler complete");
    };

    process.once("disconnect", executeShutdown(shutdown));
    process.once("SIGINT", executeShutdown(shutdown));
    process.once("SIGTERM", executeShutdown(shutdown));
    process.once("uncaughtException", executeShutdown(shutdown));
    process.once("unhandledRejection", executeShutdown(shutdown));
  })().catch((err) =>
    console.error("Error during shutdown handler registration", err)
  );
};
