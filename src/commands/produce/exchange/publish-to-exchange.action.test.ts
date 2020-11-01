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
  routingKey = "",
  bindArgs = {}
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

  await channel.bindQueue(queue.queue, exchange.exchange, routingKey, bindArgs);

  return { connection, channel, queue };
}

async function disconnectTestFromBroker(
  connection: Connection,
  channel: ConfirmChannel
): Promise<void> {
  await channel.close();
  await connection.close();
}

/**
 * Helper function which will run the provided operation and await the resulting test message.
 *
 * It will resolve once the message arrives and the test passes.
 *
 * @param channel The AMQP channel to 'listen for the message'
 * @param queue The information about the queue to use for this channel
 * @param operation The thunk representing the operation to perform, which should with message arriving
 * @param done The Jest done callback which will be called once the message finally arrives
 */
function runOperationAndAwaitMessage(
  channel: ConfirmChannel,
  queue: AssertQueue,
  operation: () => Promise<void> | void,
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
      .then(() => operation())
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

    await runOperationAndAwaitMessage(
      channel,
      queue,
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      done
    );
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

    await runOperationAndAwaitMessage(
      channel,
      queue,
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      done
    );
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

    await runOperationAndAwaitMessage(
      channel,
      queue,
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      done
    );
    await disconnectTestFromBroker(connection, channel);
  });

  test("it sends a message to the appointed exchange (headers)", async (done) => {
    const cmd = ({
      durable: false,
      autoDelete: true,
      assert: true,
      exchangeType: "headers",
      routingKey: "",
      headers: ["headerA=A", "headerB=B"],
    } as unknown) as Command;

    const exchangeName = "test-exchange-producer-headers";
    const { connection, channel, queue } = await connectTestToBroker(
      exchangeName,
      cmd.exchangeType,
      "",
      {
        headerA: "A",
        headerB: "B",
      }
    );

    await runOperationAndAwaitMessage(
      channel,
      queue,
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      done
    );
    await disconnectTestFromBroker(connection, channel);
  });
});
