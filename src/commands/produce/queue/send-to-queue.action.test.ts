import { Command } from "commander";
import * as amqp from "amqplib";
import { actionProduceQueue } from "./send-to-queue.action";
import { InputReaderGen } from "../../../utils/io";

jest.unmock("amqplib");

describe("Produce To Queue Action", () => {
  test("it sends a message to the appointed queue", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();
    const q = await ch.assertQueue("test-queue-producer", {
      durable: false,
      autoDelete: true,
    });

    const { consumerTag } = await ch.consume(q.queue, async (msg) => {
      await ch.cancel(consumerTag);
      await ch.close();
      await conn.close();

      const text = msg?.content.toString();
      expect(text).toEqual("test-message");

      done();
    });

    const readInput: InputReaderGen = function* () {
      yield "test-message";
    };

    await actionProduceQueue(
      "test-queue-producer",
      (cmd as unknown) as Command,
      readInput
    );
  });
});
