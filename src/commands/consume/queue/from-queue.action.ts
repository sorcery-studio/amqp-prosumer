import { debug } from "debug";
import { Command } from "commander";
import {
  cancelConsumer,
  closeChannel,
  connectToBroker,
  consume,
  ConsumeCallback,
  createChannel,
  declareQueue,
  disconnectFromBroker,
  IConsumerContext,
} from "../../../utils/amqp-adapter";
import {
  registerShutdownHandler,
  RegisterShutdownHandlerFn,
  ShutdownHandlerFn,
} from "../../common";
import { writeMessageToFile } from "../output-writer";
import { Options } from "amqplib";

const log = debug("amqp-prosumer:consumer");

/** TODO: Remove duplicate? */
function buildQueueOptionsFrom(command: Command): Options.AssertQueue {
  return {
    durable: command.durable,
    autoDelete: command.autoDelete,
    exclusive: command.exclusive,
  };
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
  command: Command,
  onMessage: ConsumeCallback = writeMessageToFile,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
  return new Promise((resolve, reject) => {
    log("Staring the consumer for queue", queueName);

    const registerConsumerShutdown = (context: IConsumerContext): void => {
      log("Consumer started %s", context.consumerTag);
      const handler = async (): Promise<void> => {
        cancelConsumer(context)
          .then(closeChannel)
          .then(disconnectFromBroker)
          .catch((err) => console.error("Error during shutdown", err));
      };
      regShutdown(handler);
      resolve(handler);
    };

    connectToBroker(command.url)
      .then(createChannel)
      .then(
        declareQueue(queueName, buildQueueOptionsFrom(command), command.assert)
      )
      .then(consume(onMessage)) // Note: OnMessage could actually be done on rxjs, but that's not the goal of the project
      .then(registerConsumerShutdown)
      .catch((err) => {
        console.error("Error during queue consumption", err);
        reject(err);
      });
  });
}
