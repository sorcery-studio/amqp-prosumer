const log = (jest.fn() as unknown) as Debugger;

jest.mock("debug", () => {
  return {
    debug: (): Debugger => log,
  };
});

import { createAmqpAdapter } from "./amqp-adapter";
import { Debugger } from "debug";

describe("AMQP Adapter", () => {
  test("Can be created", async () => {
    const adapter = await createAmqpAdapter({
      url: "amqp://localhost",
    });

    // Duck type check to confirm valid result
    expect(adapter).toHaveProperty("publish");
    expect(adapter).toHaveProperty("sendToQueue");
    expect(adapter).toHaveProperty("consume");
    expect(adapter).toHaveProperty("cancel");
    expect(adapter).toHaveProperty("disconnect");
  });

  describe("Diagnostic logging", () => {
    test.skip("Logs diagnostic information for different events on connection or channel", async () => {
      const adapter = await createAmqpAdapter({
        url: "amqp://localhost",
      });

      expect(log).toBeCalledWith(
        "Connection to %s established",
        "amqp://localhost"
      );

      expect(log).toBeCalledWith("Channel created");

      // Trigger additional events

      const err = new Error("Example error");

      expect(log).not.toBeCalledWith(
        "Received Channel#close() with Error",
        err
      );

      // amqp.channel.emit("close", err);
      // expect(log).toBeCalledWith("Received Channel#close() with Error", err);

      expect(log).not.toBeCalledWith("Channel#error()", err);
      // adapter.channel.emit("error", err);
      // expect(log).toBeCalledWith("Channel#error()", err);

      const reason = "X";
      expect(log).not.toBeCalledWith("Channel#blocked()", reason);
      // adapter.channel.emit("blocked", reason);
      // expect(log).toBeCalledWith("Channel#blocked()", reason);

      expect(log).not.toBeCalledWith("Channel#unblocked()", reason);
      // adapter.channel.emit("unblocked", reason);
      // expect(log).toBeCalledWith("Channel#unblocked()", reason);

      const msg = "Y";
      expect(log).not.toBeCalledWith("Channel#return()", msg);
      // adapter.channel.emit("return", msg);
      // expect(log).toBeCalledWith("Channel#return()", msg);

      await adapter.disconnect();

      expect(log).toBeCalledWith("Closing channel");
      expect(log).toBeCalledWith("Channel#close()");
      expect(log).toBeCalledWith("Channel closed");
      expect(log).toBeCalledWith("Shutting down the connection");
      expect(log).toBeCalledWith("Shutdown completed");
    });
  });

  // describe("Waiting for drain helper", () => {
  //   test("can be used to await for the drain event on a channel", async () => {
  //     const broker = await createAmqpAdapter(log, "amqp://localhost");
  //
  //     setTimeout(() => {
  //       broker.channel.emit("drain");
  //     });
  //
  //     await waitForDrain(broker.channel);
  //
  //     expect(log).toBeCalledWith("Channel#drain()");
  //
  //     await disconnectFromBroker(log, broker);
  //
  //     expect(true).toEqual(true);
  //   });
  // });
});
