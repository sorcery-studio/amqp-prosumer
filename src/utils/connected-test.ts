import * as amqp from "amqplib";
import { Channel } from "amqplib";
import { ExchangeType } from "../types";

interface IConnectedTest {
  disconnectTestFromBroker(): Promise<void>;
}

interface IProduceToExchangeTest extends IConnectedTest {
  publishTestMessage(message: string): void;
}

interface IProduceToQueueTest extends IConnectedTest {
  sendTestMessage(message: string): void;
}

interface IConsumerTest extends IConnectedTest {
  runAndListenForMessage(
    when: () => Promise<void> | void,
    then: (message: string) => Promise<void> | void
  ): Promise<void>;
}

interface IProduceToExchangeOptions {
  exchangeName: string;
  exchangeType: ExchangeType;
  routingKey: string;
}

interface IProduceToQueueOptions {
  queueName: string;
}

interface IConsumeQueueOptions {
  queueName: string;
}

interface IBindToExchangeOptions {
  exchangeName: string;
  exchangeType: ExchangeType;
  routingKey: string;
  bindArgs?: any;
}

const TEMPORARY_ENTITY = {
  autoDelete: true,
  durable: false,
};

async function connect(): Promise<{
  channel: Channel;
  disconnect: () => Promise<void>;
}> {
  const connection = await amqp.connect("amqp://localhost");

  const channel = await connection.createChannel();

  return {
    channel,
    disconnect: async (): Promise<void> => {
      await channel.close();
      await connection.close();
    },
  };
}

export async function connectTestAsExchangeProducer(
  options: IProduceToExchangeOptions
): Promise<IProduceToExchangeTest> {
  const { channel, disconnect } = await connect();

  const exchange = await channel.assertExchange(
    options.exchangeName,
    options.exchangeType,
    TEMPORARY_ENTITY
  );

  function publishTestMessage(msg: string): void {
    channel.publish(exchange.exchange, options.routingKey, Buffer.from(msg));
  }

  return {
    disconnectTestFromBroker: disconnect,
    publishTestMessage,
  };
}

export async function createTestAsQueueProducer(
  options: IProduceToQueueOptions
): Promise<IProduceToQueueTest> {
  const { channel, disconnect } = await connect();

  const queue = await channel.assertQueue(options.queueName, TEMPORARY_ENTITY);

  function sendTestMessage(msg: string): void {
    channel.sendToQueue(queue.queue, Buffer.from(msg));
  }

  return {
    disconnectTestFromBroker: disconnect,
    sendTestMessage,
  };
}

export async function connectTestAsConsumer(
  queueOptions: IConsumeQueueOptions,
  exchangeOptions?: IBindToExchangeOptions
): Promise<IConsumerTest> {
  const { channel, disconnect } = await connect();

  const queue = await channel.assertQueue(
    queueOptions.queueName,
    TEMPORARY_ENTITY
  );

  if (exchangeOptions) {
    const exchange = await channel.assertExchange(
      exchangeOptions.exchangeName,
      exchangeOptions.exchangeType,
      TEMPORARY_ENTITY
    );

    await channel.bindQueue(
      queue.queue,
      exchange.exchange,
      exchangeOptions.routingKey,
      exchangeOptions.bindArgs
    );
  }

  function runAndListenForMessage(
    when: () => Promise<void> | void,
    then: (message: string) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      channel
        .consume(queue.queue, (msg) => {
          if (msg === null) {
            reject(new Error("The expected message did not arrive"));
            return;
          }

          then(msg.content.toString());
          resolve();
        })
        .then(() => when())
        .catch((err) => reject(err));
    });
  }

  return {
    disconnectTestFromBroker: disconnect,
    runAndListenForMessage,
  };
}
