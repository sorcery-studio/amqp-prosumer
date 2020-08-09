import { Command } from "commander";
import { debug } from "debug";
import fs from "fs";
import { Channel, ConsumeMessage, Replies } from "amqplib";
import { connectToBroker, disconnectFromBroker } from "../../utils/broker";
import AssertExchange = Replies.AssertExchange;
import {
  registerShutdownHandler,
  RegisterShutdownHandlerFn,
  ShutdownHandlerFn,
} from "../common";

type ConsumerFn = (msg: ConsumeMessage) => void;

const log = debug("amqp-prosumer:consumer");

export const defOnMessage: ConsumerFn = (msg) => {
  const write = msg.content.toString("utf-8");
  log("Consuming message", write);

  fs.writeFileSync(1, write + "\n");
};

async function assertExchange(
  exchangeName: string,
  command: Command,
  channel: Channel
): Promise<AssertExchange> {
  log("Asserting ", exchangeName);
  const exchangeOptions = {
    durable: command.durable,
  };
  const exchange = await channel.assertExchange(
    exchangeName,
    "topic",
    exchangeOptions
  );
  log("Exchange %s asserted", exchange.exchange, exchangeOptions);
  return exchange;
}

export async function actionConsumeExchange(
  exchangeName: string,
  command: Command,
  onMessage: ConsumerFn = defOnMessage,
  onShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
  log("Staring the consumer for exchange", exchangeName);

  const { connection, channel } = await connectToBroker(log, command.uri);

  if (command.assert) {
    await assertExchange(exchangeName, command, channel);
  }

  const queue = await channel.assertQueue("", {
    autoDelete: true,
    durable: false,
    exclusive: true,
  });
  log("Asserted temporary queue for consumer purposes", queue.queue);

  await channel.bindQueue(queue.queue, exchangeName, "#");
  log("Bound queue %s to exchange %s", queue.queue, exchangeName);

  const { consumerTag } = await channel.consume(queue.queue, (msg) => {
    if (msg === null) {
      log("Consumer cancelled by server");
      return;
    }

    onMessage(msg);

    channel.ack(msg);
  });

  log(
    "Consumer started, input exchange %s, consumer tag: %s",
    exchangeName,
    consumerTag
  );

  const shutdown = async (): Promise<void> => {
    log("Shutting down the consumer");
    await channel.cancel(consumerTag);
    await disconnectFromBroker(log, { connection, channel });
    log("Shutdown completed");
  };

  onShutdown(shutdown);

  return shutdown;
}
