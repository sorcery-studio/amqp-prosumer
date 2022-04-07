import { debug } from "debug";
import {
  bindQueueAndExchange,
  cancelConsumer,
  closeChannel,
  connectToBroker,
  startConsumer,
  createChannel,
  declareExchange,
  declareQueue,
  disconnectFromBroker,
  IConsumerContext,
  OnMessageClbk,
} from "../../../utils/amqp-adapter";
import {
  registerShutdownHandler,
  RegisterShutdownHandlerFn,
  ShutdownHandlerFn,
} from "../../common";
import { writeMessageToFile } from "../output-writer";
import { Options } from "amqplib";
import { IConsumeFromExchangeCommandOptions } from "./from-exchange.command";

const log = debug("amqp-prosumer:consumer");

function buildDefaultQueueOptions(): Options.AssertQueue {
  return {
    autoDelete: true,
    durable: false,
    exclusive: true,
  };
}

function buildExchangeOptionsFrom(
  command: IConsumeFromExchangeCommandOptions
): Options.AssertExchange {
  return {
    durable: command.durable,
    autoDelete: true,
  };
}

export async function actionConsumeExchange(
  exchangeName: string,
  command: IConsumeFromExchangeCommandOptions,
  onMessage: OnMessageClbk = writeMessageToFile,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
  return new Promise((resolve, reject) => {
    log("Staring the consumer for exchange", exchangeName);

    const registerConsumerShutdown = (context: IConsumerContext): void => {
      const shutdown: ShutdownHandlerFn = () => {
        return cancelConsumer(context)
          .then(closeChannel)
          .then(disconnectFromBroker)
          .catch((err) => console.error("Error during shutdown", err));
      };

      regShutdown(shutdown);
      resolve(shutdown);
    };

    // Create a connection, then enhance the connection context - this is implementing state
    // in FP-style - the state is enhanced in an immutable manner, and passed from one function to
    // another
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
      .then(startConsumer(onMessage))
      .then(registerConsumerShutdown)
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}
