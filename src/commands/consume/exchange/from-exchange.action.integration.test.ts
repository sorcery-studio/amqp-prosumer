import { actionConsumeExchange } from "./from-exchange.action";
import { ConsumeCallback, ConsumeResult } from "../../../utils/amqp-adapter";
import { connectTestAsExchangeProducer } from "../../../utils/connected-test";

jest.unmock("amqplib");

process.on("unhandledRejection", (rej) => {
  console.error(rej);
});

describe("Consume From Exchange Action Integration Tests", () => {
  test("it consumes a message which is sent to the exchange and writes it as a new line to STDIO", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      url: "amqp://localhost",
    };

    const { disconnectTestFromBroker, publishTestMessage } =
      await connectTestAsExchangeProducer({
        exchangeName: "test-exchange",
        routingKey: "",
        exchangeType: "topic",
      });

    const onMessage: ConsumeCallback = (msg) => {
      expect(msg.content.toString()).toEqual("test-message");

      done();

      // Close the connection after you ACK the message to not run into channel closed issue
      setTimeout(() => {
        shutdown().catch((err) =>
          console.log(
            "Error while shutting down the AMQP connection from the test",
            err
          )
        );
      });

      return ConsumeResult.ACK;
    };

    const shutdown = await actionConsumeExchange(
      "test-exchange",
      cmd,
      onMessage
    );

    publishTestMessage("test-message");

    await disconnectTestFromBroker();
  });
});
