import { Command } from "commander";
import { debug } from "debug";
import fs from "fs";
import { ConsumeMessage } from "amqplib";
import { connectToBroker, disconnectFromBroker } from "./broker";

type ConsumerFn = (msg: ConsumeMessage) => void;

const log = debug("amqp-prosumer:consumer");

export const defOnMessage: ConsumerFn = (msg) => {
  log("Consuming message");

  const write = msg.content
    .toString("utf-8")
    .replace(/^"/, "")
    .replace(/"$/, "");

  fs.writeFileSync(1, write + "\n");
};

export async function actionConsume(
  command: Command,
  onMessage: ConsumerFn = defOnMessage
): Promise<void> {
  log("Staring the consumer process");

  if (!command.exchange && !command.queue) {
    throw new Error("Either exchange or queue have to be specified");
  }

  const { connection, channel } = await connectToBroker(command.host, log);

  let exchange;
  let queue;

  if (command.exchange) {
    exchange = await channel.assertExchange(command.exchange, "topic");
    log("Exchange %s asserted", exchange.exchange);

    queue = await channel.assertQueue(command.queue, {
      durable: false,
      autoDelete: true,
    });
    log("Queue %s asserted", queue.queue);

    await channel.bindQueue(queue.queue, exchange.exchange, "#");
    log("Bound queue %s to exchange", queue.queue, exchange.exchange);
  } else {
    queue = await channel.assertQueue(command.queue, {
      durable: false,
      autoDelete: true,
    });
  }

  const { consumerTag } = await channel.consume(queue.queue, (msg) => {
    if (!msg) {
      log("Consumer cancelled");
      return;
    }

    onMessage(msg);

    channel.ack(msg);
  });
  log(
    "Consumer started, input queue %s, consumer tag: %s",
    queue.queue,
    consumerTag
  );

  let isShuttingDown = false;
  const shutdown = async (): Promise<void> => {
    if (isShuttingDown) {
      log("The consumer is already shutting down");
      return;
    }

    isShuttingDown = true;

    log("Shutting down the consumer");
    await channel.cancel(consumerTag);
    // ToDo: clean exchange and queue?
    await disconnectFromBroker(connection, log);
    log("Shutdown completed");
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", shutdown);
  process.on("unhandledRejection", shutdown);
}
