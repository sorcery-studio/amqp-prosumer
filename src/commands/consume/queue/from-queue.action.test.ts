import { actionConsumeQueue } from "./from-queue.action";
import { ConsumeCallback, ConsumeResult } from "../../../utils/amqp-adapter";
import { createTestAsQueueProducer } from "../../../utils/connected-test";
import { IConsumeFromQueueCommand } from "./from-queue.command";

jest.unmock("amqplib");

describe("Consume From Queue Action", () => {
  test("it consumes a message which is sent to the queue", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      url: "amqp://localhost",
    };

    const {
      disconnectTestFromBroker,
      sendTestMessage,
    } = await createTestAsQueueProducer({
      queueName: "test-queue",
    });

    const onMessage: ConsumeCallback = async (msg) => {
      await shutdown();

      expect(msg.content.toString()).toEqual("test-message");

      done();

      return ConsumeResult.ACK;
    };

    const shutdown = await actionConsumeQueue(
      "test-queue",
      cmd as IConsumeFromQueueCommand,
      onMessage
    );

    sendTestMessage("test-message");
    await disconnectTestFromBroker();
  });
});
