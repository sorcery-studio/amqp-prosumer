import { debug } from "debug";
import fs from "fs";
import {
  cancelConsumer,
  closeChannel,
  connectToBroker,
  consume,
  ConsumeCallback,
  ConsumeResult,
  createChannel,
  declareQueue,
  disconnectFromBroker,
} from "../../utils/amqp-adapter";
import { registerShutdownHandler, RegisterShutdownHandlerFn } from "../common";
import { ConsumeFromQueueCommand } from "./from-queue.command";

const log = debug("amqp-prosumer:consumer");

export const defOnMessage: ConsumeCallback = async (msg) => {
  const write = msg.content.toString("utf-8");
  log("Consuming message", write);

  fs.writeFileSync(1, write + "\n");

  return ConsumeResult.ACK;
};

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
  onMessage: ConsumeCallback = defOnMessage,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<void> {
  log("Staring the consumer for queue", queueName);

  const queueOptions = {
    name: queueName,
    durable: command.durable,
    autoDelete: command.autoDelete,
    exclusive: command.exclusive,
  };

  connectToBroker(command.uri)
    .then(createChannel)
    .then(declareQueue(queueName, queueOptions, command.assert))
    .then(consume(onMessage))
    .then((context) => {
      regShutdown(async () => {
        cancelConsumer(context)
          .then(closeChannel)
          .then(disconnectFromBroker)
          .catch((err) => console.error("Error during shutdown", err));
      });
      return context;
    })
    .catch((err) => console.error(err));
}
