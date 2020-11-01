import { Command } from "commander";
import { debug, Debugger } from "debug";
import { readInputFile } from "../../../utils/io";
import {
  closeChannel,
  connectToBroker,
  createChannel,
  declareExchange,
  disconnectFromBroker,
  IConnectionContext,
  publish,
} from "../../../utils/amqp-adapter";
import { Options } from "amqplib";

const logger = debug("amqp-prosumer:producer");

function buildExchangeOptionsFrom(command: Command): Options.AssertExchange {
  return {
    durable: command.durable,
    autoDelete: command.autoDelete,
  };
}

type PublishHeaders = { [key: string]: string };

function parseHeaders(command: Command): PublishHeaders {
  return command.headers?.reduce((prev: PublishHeaders, cur: string) => {
    const parts = cur.split("=");

    return {
      ...prev,
      [parts[0]]: parts[1],
    };
  }, {});
}

function buildPublishOptionsFrom(command: Command): Options.Publish {
  return {
    headers: parseHeaders(command),
  };
}

export async function actionProduceExchange(
  exchangeName: string,
  command: Command,
  readInput = readInputFile,
  sendOutput = publish,
  log: Debugger = logger
): Promise<void> {
  log("Staring the producer action");

  const exchangeOptions = buildExchangeOptionsFrom(command);
  const publishOptions = buildPublishOptionsFrom(command);

  const sendMessages = async (
    context: IConnectionContext
  ): Promise<IConnectionContext> => {
    for (const message of readInput()) {
      await sendOutput(context, message, command.routingKey, publishOptions);
    }

    return context;
  };

  const setupExchange = declareExchange(
    exchangeName,
    command.exchangeType,
    exchangeOptions,
    command.assert
  );

  connectToBroker(command.url)
    .then(createChannel)
    .then(setupExchange)
    .then(sendMessages)
    .then(closeChannel)
    .then(disconnectFromBroker)
    .then(() => log("Produce action executed successfully"))
    .catch((err) =>
      console.error(
        "Publishing to exchange was affected by the following error",
        err
      )
    );
}
