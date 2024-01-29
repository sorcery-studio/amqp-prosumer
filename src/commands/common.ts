import { Command } from "commander";
import { debug } from "debug";
import { EventEmitter } from "events";

export type CommandFactoryFn = (name?: string | undefined) => Command;

/**
 * Represents an object which can receive the "exit" call and will break the execution immediately
 */
export interface ExitReceiver {
  exit: (code?: number) => never;
}

const log = debug("amqp-prosumer:shutdown");

export const EXIT_ERROR_CODE = 1;

export function reportErrorAndExit(
  err: unknown,
  receiver: ExitReceiver = process,
): never {
  // eslint-disable-next-line no-console
  if (err instanceof Error) {
    console.error("ERROR:", err.message, err.stack);
  } else {
    console.error("ERROR:", err);
  }

  receiver.exit(EXIT_ERROR_CODE);
}

export type ShutdownHandlerFn = () => Promise<void>;

export type RegisterShutdownHandlerFn = (
  handler: ShutdownHandlerFn,
  emitter?: EventEmitter,
) => void;

/**
 * Register a handler function which will be called for SIGINT/SIGTERM or on error conditions
 *
 * Some actions are long running and they need the SIGINT/SIGTERM signals to be sent
 * in order to get closed. This function helps in implementing this behaviour
 *
 * @param handler The function which should be executed upon supported event
 * @param emitter The instance of event emitter to which the shutdown handler should be bound
 */
export const registerShutdownHandler: RegisterShutdownHandlerFn = (
  handler: ShutdownHandlerFn,
  emitter: EventEmitter = process,
) => {
  ((): void => {
    const shutdown = (): void => {
      log("Running shutdown handler");
      handler()
        .then(() => log("Shutdown handler complete"))
        .catch((err) =>
          console.error(
            "Error during shutdown handler execution: %s",
            err.message,
          ),
        );
    };

    emitter.once("disconnect", shutdown);
    emitter.once("SIGINT", shutdown);
    emitter.once("SIGTERM", shutdown);
    emitter.once("uncaughtException", shutdown);
    emitter.once("unhandledRejection", shutdown);
  })();
};
