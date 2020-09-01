import { debug } from "debug";
import fs from "fs";
import {
  createAmqpAdapter,
  ConsumeCallback,
  ConsumeResult,
} from "../../utils/amqp-adapter";
import {
  registerShutdownHandler,
  RegisterShutdownHandlerFn,
  ShutdownHandlerFn,
} from "../common";
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
): Promise<ShutdownHandlerFn> {
  log("Staring the consumer for queue", queueName);

  const { consume, cancel, disconnect } = await createAmqpAdapter({
    url: command.uri,
    assert: command.assert,
    queue: {
      name: queueName,
      durable: command.durable,
      autoDelete: command.autoDelete,
      exclusive: command.exclusive,
    },
  });

  const onShutdown = async (): Promise<void> => {
    log("Shutting down the consumer");
    await cancel(consumerTag);
    await disconnect();
    log("Shutdown completed");
  };

  const { consumerTag } = await consume(onMessage, onShutdown);

  log(
    "Consumer started, input queue %s, consumer tag: %s",
    queueName,
    consumerTag
  );

  // Note, we're not using function composition

  // input: consumer configuration
  // output: confirmations of message writes

  // consumerConfig
  // createConsumer (cfg)
  // consume (consumer)

  regShutdown(onShutdown);

  return onShutdown;
}
