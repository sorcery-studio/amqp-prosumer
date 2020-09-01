import { Command } from "commander";
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

const log = debug("amqp-prosumer:consumer");

export const defOnMessage: ConsumeCallback = async (msg) => {
  const write = msg.content.toString("utf-8");

  log("Consuming message", write);

  fs.writeFileSync(1, write + "\n");

  return ConsumeResult.ACK;
};

export async function actionConsumeExchange(
  exchangeName: string,
  command: Command,
  onMessage: ConsumeCallback = defOnMessage,
  regShutdown: RegisterShutdownHandlerFn = registerShutdownHandler
): Promise<ShutdownHandlerFn> {
  log("Staring the consumer for exchange", exchangeName);

  const { consume, cancel, disconnect } = await createAmqpAdapter({
    url: command.uri,
    exchange: {
      name: exchangeName,
      type: "topic",
      durable: command.durable,
      autoDelete: command.autoDelete,
    },
    queue: {
      name: "",
      autoDelete: true,
      durable: false,
      exclusive: true,
    },
    bind: {
      routingKey: "#",
    },
    assert: command.assert,
  });

  const onShutdown = async (): Promise<void> => {
    log("Shutting down the consumer");
    await cancel(consumerTag);
    await disconnect();
    log("Shutdown completed");
  };

  const { consumerTag } = await consume(onMessage, onShutdown);

  log(
    "Consumer started, input exchange %s, consumer tag: %s",
    exchangeName,
    consumerTag
  );

  regShutdown(onShutdown);

  return onShutdown;
}
