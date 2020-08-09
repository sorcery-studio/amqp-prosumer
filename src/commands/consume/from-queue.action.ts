import { debug } from "debug";
import fs from "fs";
import { Channel, ConsumeMessage, Replies } from "amqplib";
import { connectToBroker, disconnectFromBroker } from "../../utils/broker";
import AssertQueue = Replies.AssertQueue;
import {
  registerShutdownHandler,
  RegisterShutdownHandlerFn,
  ShutdownHandlerFn,
} from "../common";
import { ConsumeFromQueueCommand } from "./from-queue.command";

type ConsumerFn = (msg: ConsumeMessage) => void;

const log = debug("amqp-prosumer:consumer");

export const defOnMessage: ConsumerFn = (msg) => {
  const write = msg.content.toString("utf-8");
  log("Consuming message", write);

  fs.writeFileSync(1, write + "\n");
};

async function assertQueue(
  queueName: string,
  command: ConsumeFromQueueCommand,
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

/**
 * Starts the consumer action and returns the shutdown function
 *
 * @param queueName The queue which should be consumed by the action
 * @param command Command options
 * @param onMessage Function which will be called for each consumed message
 * @param regShutdown Function which will be used to register the returned shutdown function
 *
 * @returns Shutdown function which can be used to stop the consumer manually
 */
export async function actionConsumeQueue(
  queueName: string,
  command: ConsumeFromQueueCommand,
  onMessage: ConsumerFn = defOnMessage,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
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

    log("Received message");

    onMessage(msg);

    channel.ack(msg);
  });

  log(
    "Consumer started, input queue %s, consumer tag: %s",
    queueName,
    consumerTag
  );

  const shutdown = async (): Promise<void> => {
    log("Shutting down the consumer");
    await channel.cancel(consumerTag);
    await disconnectFromBroker(log, { connection, channel });
    log("Shutdown completed");
  };

  regShutdown(shutdown);

  return shutdown;
}
