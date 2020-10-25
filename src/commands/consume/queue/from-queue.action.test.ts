import * as amqp from "amqplib";
import { actionConsumeQueue } from "./from-queue.action";
import { ConsumeCallback, ConsumeResult } from "../../../utils/amqp-adapter";
import { Command } from "commander";

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
    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();

    const onMessage: ConsumeCallback = async (msg) => {
      await ch.waitForConfirms();
      await ch.close();
      await conn.close();

      if (shutdown) {
        await shutdown();
      }

      expect(msg.content.toString()).toEqual("test-message");

      done();

      return ConsumeResult.ACK;
    };

    const shutdown = await actionConsumeQueue(
      "test-queue",
      (cmd as unknown) as Command,
      onMessage
    );

    ch.sendToQueue("test-queue", Buffer.from("test-message"));
  });
});
