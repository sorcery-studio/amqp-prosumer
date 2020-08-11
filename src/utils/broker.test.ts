import { connectToBroker, disconnectFromBroker, waitForDrain } from "./broker";
import { Debugger } from "debug";

const log = (jest.fn() as unknown) as Debugger;

jest.unmock("amqplib");

describe("Broker Utils", () => {
  describe("Connecting to broker", () => {
    test("Connection can be opened and closed", async () => {
      const brokerConnection = await connectToBroker(log, "amqp://localhost");

      // Duck type check to confirm valid result
      expect(brokerConnection.connection).toHaveProperty("close");
      expect(brokerConnection.channel).toHaveProperty("close");

      // Spy on the behaviour to confirm implementation
      const spyConnClose = jest.spyOn(brokerConnection.connection, "close");
      const spyChClose = jest.spyOn(brokerConnection.channel, "close");

      await disconnectFromBroker(log, brokerConnection);

      expect(spyChClose).toBeCalled();
      expect(spyConnClose).toBeCalled();
    });
  });

  describe("Diagnostic logging", () => {
    test("Logs diagnostic information for different events on connection or channel", async () => {
      const broker = await connectToBroker(log, "amqp://localhost");

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
      broker.channel.emit("close", err);
      expect(log).toBeCalledWith("Received Channel#close() with Error", err);

      expect(log).not.toBeCalledWith("Channel#error()", err);
      broker.channel.emit("error", err);
      expect(log).toBeCalledWith("Channel#error()", err);

      const reason = "X";
      expect(log).not.toBeCalledWith("Channel#blocked()", reason);
      broker.channel.emit("blocked", reason);
      expect(log).toBeCalledWith("Channel#blocked()", reason);

      expect(log).not.toBeCalledWith("Channel#unblocked()", reason);
      broker.channel.emit("unblocked", reason);
      expect(log).toBeCalledWith("Channel#unblocked()", reason);

      const msg = "Y";
      expect(log).not.toBeCalledWith("Channel#return()", msg);
      broker.channel.emit("return", msg);
      expect(log).toBeCalledWith("Channel#return()", msg);

      await disconnectFromBroker(log, broker);

      expect(log).toBeCalledWith("Closing channel");
      expect(log).toBeCalledWith("Channel#close()");
      expect(log).toBeCalledWith("Channel closed");
      expect(log).toBeCalledWith("Shutting down the connection");
      expect(log).toBeCalledWith("Shutdown completed");
    });
  });

  describe("Waiting for drain helper", () => {
    test("can be used to await for the drain event on a channel", async () => {
      const broker = await connectToBroker(log, "amqp://localhost");

      setTimeout(() => {
        broker.channel.emit("drain");
      });

      await waitForDrain(broker.channel);

      expect(log).toBeCalledWith("Channel#drain()");

      await disconnectFromBroker(log, broker);

      expect(true).toEqual(true);
    });
  });
});
