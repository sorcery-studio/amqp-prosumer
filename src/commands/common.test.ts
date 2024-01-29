/* eslint-disable no-console */
import {
  reportErrorAndExit,
  EXIT_ERROR_CODE,
  ShutdownHandlerFn,
  registerShutdownHandler,
  ExitReceiver,
} from "./common";
import { EventEmitter } from "events";

describe("Common", () => {
  describe("Reporting Error & Exiting", () => {
    test("it logs the error on console and exits", () => {
      const NUM_ASSERTIONS = 2;
      expect.assertions(NUM_ASSERTIONS);

      const exitReceiver = {
        exit: jest.fn(),
      } as unknown as ExitReceiver;

      const consoleSpy = jest.spyOn(console, "error");
      consoleSpy.mockImplementation();

      const err = new Error("Example Error");

      reportErrorAndExit(err, exitReceiver);

      expect(consoleSpy).toHaveBeenCalledWith("ERROR:", err.message, err.stack);
      expect(exitReceiver.exit).toHaveBeenCalledWith(EXIT_ERROR_CODE);
    });
  });

  describe("Registering shutdown handlers", () => {
    test.each([
      "SIGTERM",
      "SIGINT",
      "disconnect",
      "unhandledRejection",
      "uncaughtException",
    ])(
      "A handler can be registered and will get executed on %s event",
      (event) => {
        const handler: ShutdownHandlerFn = jest.fn(() => {
          return Promise.resolve();
        });

        const emitter = new EventEmitter();

        registerShutdownHandler(handler, emitter);

        emitter.emit(event);

        expect(handler).toHaveBeenCalled();
      },
    );
  });

  test("Logs an error when the handler would reject with an error", async () => {
    const errorSpy = jest.spyOn(console, "error");

    const handler: ShutdownHandlerFn = jest.fn(() => {
      return Promise.reject(new Error("Something bad happened"));
    });

    const emitter = new EventEmitter();

    registerShutdownHandler(handler, emitter);

    emitter.emit("SIGTERM");

    expect(handler).toHaveBeenCalled();
    await expect(handler).rejects.toThrow("Something bad happened");
    expect(errorSpy).toHaveBeenCalledWith(
      "Error during shutdown handler execution: %s",
      "Something bad happened",
    );
  });
});
