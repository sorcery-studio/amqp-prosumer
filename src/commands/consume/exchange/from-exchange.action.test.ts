import { actionConsumeExchange } from "./from-exchange.action";
import { Command } from "commander";
import { ConsumeCallback, ConsumeResult } from "../../../utils/amqp-adapter";
import { connectTestAsExchangeProducer } from "../../../utils/connected-test";

jest.unmock("amqplib");

describe("Consume From Exchange Action Integration Tests", () => {
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

      if (shutdown) {
        await shutdown();
      }

      done();

      return ConsumeResult.ACK;
    };

    const shutdown = await actionConsumeExchange(
      "test-exchange",
      (cmd as unknown) as Command,
      onMessage
    );

    publishTestMessage("test-message");
    await disconnectTestFromBroker();
  });
});
