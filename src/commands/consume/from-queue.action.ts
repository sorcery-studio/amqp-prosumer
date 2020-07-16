import { Command } from "commander";
import { debug } from "debug";
import fs from "fs";
import { Channel, ConsumeMessage, Replies } from "amqplib";
import { connectToBroker, disconnectFromBroker } from "../../utils/broker";
import AssertQueue = Replies.AssertQueue;
import { registerShutdownHandler } from "../common";

type ConsumerFn = (msg: ConsumeMessage) => void;

const log = debug("amqp-prosumer:consumer");

export const defOnMessage: ConsumerFn = (msg) => {
  const write = msg.content.toString("utf-8");
  log("Consuming message", write);

  fs.writeFileSync(1, write + "\n");
};

async function assertQueue(
  queueName: string,
  command: Command,
  channel: Channel
): Promise<AssertQueue> {
  log("Asserting queue", queueName);
  const queueOptions = {
    durable: command.durable,
    autoDelete: command.autoDelete,
    exclusive: command.exclusive,
  };
  const queue = await channel.assertQueue(queueName, queueOptions);
  log("Queue %s asserted", queue.queue, queueOptions);
  return queue;
}

export async function actionConsumeQueue(
  queueName: string,
  command: Command,
  onMessage: ConsumerFn = defOnMessage
): Promise<void> {
  log("Staring the consumer for queue", queueName);

  const { connection, channel } = await connectToBroker(log, command.uri);

  if (command.assert) {
    await assertQueue(queueName, command, channel);
  }

  const { consumerTag } = await channel.consume(queueName, (msg) => {
    if (msg === null) {
      log("Consumer cancelled by server");
      return;
    }

    onMessage(msg);

    channel.ack(msg);
  });

  log(
    "Consumer started, input queue %s, consumer tag: %s",
    queueName,
    consumerTag
  );

  registerShutdownHandler(
    async (): Promise<void> => {
      log("Shutting down the consumer");
      await channel.cancel(consumerTag);
      await disconnectFromBroker(log, { connection, channel });
      log("Shutdown completed");
    }
  );
}
