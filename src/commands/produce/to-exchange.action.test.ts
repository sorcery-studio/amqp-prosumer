import { Command } from "commander";
import * as amqp from "amqplib";
import { actionProduceExchange } from "./to-exchange.action";
import { InputReaderGen } from "../../utils/io";

jest.unmock("amqplib");

describe("Produce To Exchange Action", () => {
  test("it sends a message to the appointed exchange", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();
    const exchange = await ch.assertExchange(
      "test-exchange-producer",
      "topic",
      { durable: false, autoDelete: true }
    );
    const queue = await ch.assertQueue("", {
      autoDelete: true,
      durable: false,
    });

    await ch.bindQueue(queue.queue, exchange.exchange, "#");

    const { consumerTag } = await ch.consume(queue.queue, async (msg) => {
      const text = msg?.content.toString();

      expect(text).toEqual("test-message");

      await ch.cancel(consumerTag);
      await ch.close();
      await conn.close();

      done();
    });

    const readInput: InputReaderGen = function* () {
      yield "test-message";
    };

    await actionProduceExchange(
      "test-exchange-producer",
      (cmd as unknown) as Command,
      readInput
    );
  });
});
