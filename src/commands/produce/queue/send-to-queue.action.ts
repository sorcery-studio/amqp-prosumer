import { debug, Debugger } from "debug";
import {
  closeChannel,
  connectToBroker,
  createChannel,
  createConfirmChannel,
  declareQueue,
  disconnectFromBroker,
  IChannelCtx,
  MessageProduceFn,
  sendToQueue,
  sendToQueueConfirmed,
} from "../../../utils/amqp-adapter";
import { readInputFile } from "../../../utils/io";
import { Options } from "amqplib";

export interface ISendToQueueCommandOptions {
  url: string;
  assert: boolean;
  durable: boolean;
  autoDelete: boolean;
  confirm: boolean;
}

const logger = debug("amqp-prosumer:producer");

function buildQueueOptionsFrom(
  options: ISendToQueueCommandOptions,
): Options.AssertQueue {
  return {
    durable: options.durable,
    autoDelete: options.autoDelete,
  };
}

export function sendToQueueAction(
  queueName: string,
  options: ISendToQueueCommandOptions,
  readInput = readInputFile,
  log: Debugger = logger,
): void {
  log("Staring the producer action");

  const setupQueue = declareQueue(
    queueName,
    buildQueueOptionsFrom(options),
    options.assert,
  );

  const sendMessages =
    (sendOutput: MessageProduceFn) =>
    async (context: IChannelCtx): Promise<IChannelCtx> => {
      if (typeof context.queueName !== "string") {
        throw new Error("Can't send to queue if the the name is not defined");
      }

      for (const message of readInput()) {
        await sendOutput(context, message);
      }

      return context;
    };

  connectToBroker(options.url)
    .then(options.confirm ? createConfirmChannel : createChannel)
    .then(setupQueue)
    .then(sendMessages(options.confirm ? sendToQueueConfirmed : sendToQueue))
    .then(closeChannel)
    .then(disconnectFromBroker)
    .then(() => log("Produce action executed successfully"))
    .catch((err) => console.error("Something bad happened", err));
}
