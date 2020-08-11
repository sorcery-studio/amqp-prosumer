import { Command } from "commander";
import * as amqp from "amqplib";
import { actionProduceQueue } from "./to-queue.action";
import { InputReaderGen } from "../../utils/io";

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
      const text = msg?.content.toString();

      expect(text).toEqual("test-message");

      await ch.cancel(consumerTag);
      await ch.close();
      await conn.close();

      done();
    });

    const inputProvider: InputReaderGen = function* () {
      yield "test-message";
    };

    const result = actionProduceQueue(
      "test-queue-producer",
      (cmd as unknown) as Command,
      inputProvider
    );

    expect(result).toBeTruthy();
  });
});
