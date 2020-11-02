import { debug, Debugger } from "debug";
import {
  closeChannel,
  connectToBroker,
  createChannel,
  declareQueue,
  disconnectFromBroker,
  IConnectionContext,
  sendToQueue,
} from "../../../utils/amqp-adapter";
import { readInputFile } from "../../../utils/io";
import { Options } from "amqplib";
import { ISendToQueueCommand } from "./send-to-queue.command";

const logger = debug("amqp-prosumer:producer");

function buildQueueOptionsFrom(
  command: ISendToQueueCommand
): Options.AssertQueue {
  return {
    durable: command.durable,
    autoDelete: command.autoDelete,
  };
}

export function actionProduceQueue(
  queueName: string,
  command: ISendToQueueCommand,
  readInput = readInputFile,
  sendOutput = sendToQueue,
  log: Debugger = logger
): void {
  log("Staring the producer action");

  const setupQueue = declareQueue(
    queueName,
    buildQueueOptionsFrom(command),
    command.assert
  );

  const sendMessages = async (
    context: IConnectionContext
  ): Promise<IConnectionContext> => {
    if (typeof context.queueName !== "string") {
      throw new Error("Can't send to queue if the the name is not defined");
    }

    for (const message of readInput()) {
      await sendOutput(context, message);
    }

    return context;
  };

  connectToBroker(command.url)
    .then(createChannel)
    .then(setupQueue)
    .then(sendMessages)
    .then(closeChannel)
    .then(disconnectFromBroker)
    .then(() => log("Produce action executed successfully"))
    .catch((err) => console.error("Something bad happened", err));
}
