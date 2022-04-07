import {
  actionConsumeQueue,
  IConsumeFromQueueCommandOptions,
} from "./from-queue.action";
import { OnMessageClbk } from "../../../utils/amqp-adapter";
import { createTestAsQueueProducer } from "../../../utils/connected-test";

jest.unmock("amqplib");

describe("Consume From Queue Action Integration Tests", () => {
  test("it consumes a message which is sent to the queue", (done) => {
    (async (): Promise<void> => {
      const cmd = {
        assert: true,
        autoDelete: true,
        durable: false,
        exclusive: false,
        url: "amqp://localhost",
      };

      const { disconnectTestFromBroker, sendTestMessage } =
        await createTestAsQueueProducer({
          queueName: "test-queue",
        });

      const onMessage: OnMessageClbk = (msg) => {
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

        return Promise.resolve();
      };

      const shutdown = await actionConsumeQueue(
        "test-queue",
        cmd as IConsumeFromQueueCommandOptions,
        onMessage
      );

      sendTestMessage("test-message");
      await disconnectTestFromBroker();
    })().catch((err) => void done(err));
  });
});
