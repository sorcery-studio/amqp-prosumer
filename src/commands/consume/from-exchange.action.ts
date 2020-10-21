import { Command } from "commander";
import { debug } from "debug";
import {
  bindQueueAndExchange,
  cancelConsumer,
  closeChannel,
  connectToBroker,
  consume,
  ConsumeCallback,
  createChannel,
  declareExchange,
  declareQueue,
  disconnectFromBroker,
  IConsumerContext,
} from "../../utils/amqp-adapter";
import {
  registerShutdownHandler,
  RegisterShutdownHandlerFn,
  ShutdownHandlerFn,
} from "../common";
import { writeMessageToFile } from "./output-writer";
import { Options } from "amqplib";

const log = debug("amqp-prosumer:consumer");

function buildDefaultQueueOptions(): Options.AssertQueue {
  return {
    autoDelete: true,
    durable: false,
    exclusive: true,
  };
}

function buildExchangeOptionsFrom(command: Command): Options.AssertExchange {
  return {
    durable: command.durable,
    autoDelete: command.autoDelete,
  };
}

export async function actionConsumeExchange(
  exchangeName: string,
  command: Command,
  onMessage: ConsumeCallback = writeMessageToFile,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
  return new Promise((resolve, reject) => {
    log("Staring the consumer for exchange", exchangeName);

    const registerConsumerShutdown = (context: IConsumerContext): void => {
      const shutdown = async (): Promise<void> => {
        cancelConsumer(context)
          .then(closeChannel)
          .then(disconnectFromBroker)
          .catch((err) => console.error("Error during shutdown", err));
      };
      regShutdown(shutdown);
      resolve(shutdown);
    };

    connectToBroker(command.url)
      .then(createChannel)
      .then(declareQueue("", buildDefaultQueueOptions(), true))
      .then(
        declareExchange(
          exchangeName,
          "topic",
          buildExchangeOptionsFrom(command),
          command.assert
        )
      )
      .then(bindQueueAndExchange("#"))
      .then(consume(onMessage))
      .then(registerConsumerShutdown)
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}
