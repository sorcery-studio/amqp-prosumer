import { actionConsumeExchange } from "./from-exchange.action";
import { ConsumeCallback, ConsumeResult } from "../../../utils/amqp-adapter";
import { connectTestAsExchangeProducer } from "../../../utils/connected-test";
import { IConsumeFromExchangeCommand } from "./from-exchange.command";

jest.unmock("amqplib");

describe.skip("Consume From Exchange Action Integration Tests", () => {
  test("it consumes a message which is sent to the exchange and writes it as a new line to STDIO", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      url: "amqp://localhost",
    };

    const {
      disconnectTestFromBroker,
      publishTestMessage,
    } = await connectTestAsExchangeProducer({
      exchangeName: "test-exchange",
      routingKey: "",
      exchangeType: "topic",
    });

    const onMessage: ConsumeCallback = async (msg) => {
      expect(msg.content.toString()).toEqual("test-message");

      await shutdown();

      done();

      return ConsumeResult.ACK;
    };

    const shutdown = await actionConsumeExchange(
      "test-exchange",
      (cmd as unknown) as IConsumeFromExchangeCommand,
      onMessage
    );

    publishTestMessage("test-message");
    await disconnectTestFromBroker();
  });
});
