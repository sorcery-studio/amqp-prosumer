import { debug, Debugger } from "debug";
import { readInputFile } from "../../../utils/io";
import {
  closeChannel,
  connectToBroker,
  createChannel,
  createConfirmChannel,
  declareExchange,
  disconnectFromBroker,
  IConnectionContext,
  publish,
} from "../../../utils/amqp-adapter";
import { Options } from "amqplib";

const logger = debug("amqp-prosumer:producer");

export interface IPublishToExchangeCommandOptions {
  url: string;
  assert: boolean;
  durable: boolean;
  exchangeType: "direct" | "topic" | "headers" | "fanout";
  routingKey: string;
  autoDelete: boolean;
  headers?: string[];
  confirm: boolean;
}

function buildExchangeOptionsFrom(
  options: IPublishToExchangeCommandOptions
): Options.AssertExchange {
  return {
    durable: options.durable,
    autoDelete: options.autoDelete,
  };
}

type PublishHeaders = { [key: string]: string };

function parseHeaders(
  options: IPublishToExchangeCommandOptions
): PublishHeaders {
  const parsedHeaders = options.headers?.reduce(
    (prev: PublishHeaders, cur: string) => {
      const [name, value] = cur.split("=");

      return {
        ...prev,
        [name]: value,
      };
    },
    {}
  );

  if (parsedHeaders !== undefined) {
    return parsedHeaders;
  } else {
    return {};
  }
}

function buildPublishOptionsFrom(
  command: IPublishToExchangeCommandOptions
): Options.Publish {
  return {
    headers: parseHeaders(command),
  };
}

export function actionProduceExchange(
  exchangeName: string,
  options: IPublishToExchangeCommandOptions,
  readInput = readInputFile,
  sendOutput = publish,
  log: Debugger = logger
): void {
  log("Staring the producer action");

  const exchangeOptions = buildExchangeOptionsFrom(options);
  const publishOptions = buildPublishOptionsFrom(options);

  const sendMessages = async (
    context: IConnectionContext
  ): Promise<IConnectionContext> => {
    for (const message of readInput()) {
      await sendOutput(context, message, options.routingKey, publishOptions);
    }

    return context;
  };

  const setupExchange = declareExchange(
    exchangeName,
    options.exchangeType,
    exchangeOptions,
    options.assert
  );

  connectToBroker(options.url)
    .then(options.confirm ? createConfirmChannel : createChannel)
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
