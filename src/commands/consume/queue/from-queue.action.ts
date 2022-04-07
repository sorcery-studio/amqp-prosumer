import { debug } from "debug";
import {
  cancelConsumer,
  closeChannel,
  connectToBroker,
  consume,
  OnMessageCallback,
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

export interface IConsumeFromQueueCommandOptions {
  url: string;
  assert: boolean;
  durable: boolean;
  autoDelete: boolean;
  exclusive: boolean;
}

function buildQueueOptionsFrom(
  options: IConsumeFromQueueCommandOptions
): Options.AssertQueue {
  return {
    durable: options.durable,
    autoDelete: options.autoDelete,
    exclusive: options.exclusive,
  };
}

/**
 * Starts the consumer action and returns the shutdown function
 *
 * @param queueName The queue which should be consumed by the action
 * @param options Command options
 * @param onMessage Function which will be called for each consumed message
 * @param regShutdown Function which will be used to register the returned shutdown function
 *
 * @returns Shutdown function which can be used to stop the consumer manually
 */
export async function actionConsumeQueue(
  queueName: string,
  options: IConsumeFromQueueCommandOptions,
  onMessage: OnMessageCallback = writeMessageToFile,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
  return new Promise((resolve, reject) => {
    log("Staring the consumer for queue", queueName);

    const registerConsumerShutdown = (context: IConsumerContext): void => {
      log("Consumer started %s", context.consumerTag);
      const handler: ShutdownHandlerFn = () => {
        return cancelConsumer(context)
          .then(closeChannel)
          .then(disconnectFromBroker)
          .catch((err) => console.error("Error during shutdown", err));
      };

      regShutdown(handler);
      resolve(handler);
    };

    connectToBroker(options.url)
      .then(createChannel)
      .then(
        declareQueue(queueName, buildQueueOptionsFrom(options), options.assert)
      )
      .then(consume(onMessage)) // Note: OnMessage could actually be done on rxjs, but that's not the goal of the project
      .then(registerConsumerShutdown)
      .catch((err) => {
        console.error("The consume action encountered an error", err);
        reject(err);
      });
  });
}
