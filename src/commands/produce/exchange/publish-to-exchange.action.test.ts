import { Command } from "commander";
import * as amqp from "amqplib";
import { actionProduceExchange } from "./publish-to-exchange.action";
import { InputReaderGen } from "../../../utils/io";
import { ConfirmChannel, Connection, Replies } from "amqplib";
import AssertQueue = Replies.AssertQueue;

jest.unmock("amqplib");

const readTestInput: InputReaderGen = function* () {
  yield "test-message";
};

interface IConnectionContext {
  connection: Connection;
  channel: ConfirmChannel;
  queue: AssertQueue;
}

async function connectTestToBroker(
  exchangeName: string,
  exchangeType: string,
  routingKey: string
): Promise<IConnectionContext> {
  const connection = await amqp.connect("amqp://localhost");

  const channel = await connection.createConfirmChannel();

  const exchange = await channel.assertExchange(exchangeName, exchangeType, {
    autoDelete: true,
    durable: false,
  });

  const queue = await channel.assertQueue("", {
    autoDelete: true,
    durable: false,
  });

  await channel.bindQueue(queue.queue, exchange.exchange, routingKey);

  return { connection, channel, queue };
}

async function disconnectTestFromBroker(
  connection: Connection,
  channel: ConfirmChannel,
  consumerTag?: string
): Promise<void> {
  if (consumerTag) {
    await channel.cancel(consumerTag);
  }

  await channel.close();
  await connection.close();
}

function createMessageExpectation(
  channel: ConfirmChannel,
  queue: AssertQueue,
  done: jest.DoneCallback
): Promise<void> {
  return new Promise((resolve, reject) => {
    channel
      .consume(queue.queue, (msg) => {
        const text = msg?.content.toString();
        expect(text).toEqual("test-message");

        resolve();
        done();
      })
      .catch((err) => reject(err));
  });
}

describe("Produce To Exchange Action", () => {
  test("it sends a message to the appointed exchange (topic)", async (done) => {
    const cmd = ({
      durable: false,
      autoDelete: true,
      assert: true,
      exchangeType: "topic",
      routingKey: "some-topic",
    } as unknown) as Command;

    const exchangeName = "test-exchange-producer-topic";

    const { connection, channel, queue } = await connectTestToBroker(
      exchangeName,
      cmd.exchangeType,
      "some-topic"
    );

    const messageArrived = createMessageExpectation(channel, queue, done);
    await actionProduceExchange(exchangeName, cmd, readTestInput);
    await messageArrived;
    await disconnectTestFromBroker(connection, channel);
  });

  test("it sends a message to the appointed exchange (direct)", async (done) => {
    const cmd = ({
      durable: false,
      autoDelete: true,
      assert: true,
      exchangeType: "direct",
      routingKey: "example-key",
    } as unknown) as Command;

    const exchangeName = "test-exchange-producer-direct";

    const { connection, channel, queue } = await connectTestToBroker(
      exchangeName,
      cmd.exchangeType,
      "example-key"
    );

    const messageArrived = createMessageExpectation(channel, queue, done);
    await actionProduceExchange(exchangeName, cmd, readTestInput);
    await messageArrived;
    await disconnectTestFromBroker(connection, channel);
  });

  test("it sends a message to the appointed exchange (fanout)", async (done) => {
    const cmd = ({
      durable: false,
      autoDelete: true,
      assert: true,
      exchangeType: "fanout",
      routingKey: "fanout-key",
    } as unknown) as Command;

    const exchangeName = "test-exchange-producer-fanout";
    const { connection, channel, queue } = await connectTestToBroker(
      exchangeName,
      cmd.exchangeType,
      ""
    );

    const messageArrived = createMessageExpectation(channel, queue, done);
    await actionProduceExchange(exchangeName, cmd, readTestInput);
    await messageArrived;
    await disconnectTestFromBroker(connection, channel);
  });
});
