import * as amqp from "amqplib";
import { actionConsumeQueue } from "./from-queue.action";
import { ConsumeFromQueueCommand } from "./from-queue.command";
import { ConsumeResult } from "../../utils/amqp-adapter";

jest.unmock("amqplib");

describe("Consume From Queue Action", () => {
  test("it consumes a message which is sent to the queue", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      uri: "amqp://localhost",
    };
    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();

    const shutdown = await actionConsumeQueue(
      "test-queue",
      cmd as ConsumeFromQueueCommand,
      async (msg) => {
        expect(msg.content.toString()).toEqual("test-message");
        await ch.waitForConfirms();
        await ch.close();
        await conn.close();
        done();
        await shutdown();

        return ConsumeResult.ACK;
      }
    );

    ch.sendToQueue("test-queue", Buffer.from("test-message"));
  });
});
