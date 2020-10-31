import { Command } from "commander";
import * as amqp from "amqplib";
import { actionProduceExchange } from "./publish-to-exchange.action";
import { InputReaderGen } from "../../../utils/io";

jest.unmock("amqplib");

describe("Produce To Exchange Action", () => {
  test("it sends a message to the appointed exchange (topic)", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
      exchangeType: "topic",
      routingKey: "#"
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();
    const exchange = await ch.assertExchange(
      "test-exchange-producer-topic",
      cmd.exchangeType,
      { durable: false, autoDelete: true }
    );

    // We'll need a temporary queue to get the test results
    const queue = await ch.assertQueue("", {
      autoDelete: true,
      durable: false,
    });

    await ch.bindQueue(queue.queue, exchange.exchange, "#");

    const { consumerTag } = await ch.consume(queue.queue, async (msg) => {
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

    await actionProduceExchange(
      "test-exchange-producer-topic",
      (cmd as unknown) as Command,
      readInput
    );
  });

  test("it sends a message to the appointed exchange (direct)", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
      exchangeType: "direct",
      routingKey: "example-key"
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();
    const exchange = await ch.assertExchange(
        "test-exchange-producer-direct",
        cmd.exchangeType,
        { durable: false, autoDelete: true }
    );

    // We'll need a temporary queue to get the test results
    const queue = await ch.assertQueue("", {
      autoDelete: true,
      durable: false,
    });

    await ch.bindQueue(queue.queue, exchange.exchange, "example-key");

    const { consumerTag } = await ch.consume(queue.queue, async (msg) => {
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

    await actionProduceExchange(
        "test-exchange-producer-direct",
        (cmd as unknown) as Command,
        readInput
    );
  });
});
