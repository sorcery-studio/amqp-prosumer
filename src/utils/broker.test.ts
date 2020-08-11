import { connectToBroker, disconnectFromBroker } from "./broker";
import { Debugger } from "debug";

describe("Broker Utils", () => {
  describe("Connecting to broker", () => {
    test("Connection can be opened and closed", async () => {
      const log = (jest.fn() as unknown) as Debugger;

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
});
