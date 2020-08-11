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

  describe("Waiting for drain helper", () => {
    test("can be used to await for the drain event on a channel", async () => {
      const broker = await connectToBroker(log, "amqp://localhost");

      setTimeout(() => {
        broker.channel.emit("drain");
      });

      await waitForDrain(broker.channel);

      await disconnectFromBroker(log, broker);

      expect(true).toEqual(true);
    });
  });
});
