import { Command } from "commander";
import { CommandFactoryFn } from "../common";
import { buildPublishToExchangeCommand } from "./exchange/publish-to-exchange.command";
import { buildSendToQueueCommand } from "./queue/send-to-queue.command";

export function buildProduceCommand(commandFactory: CommandFactoryFn): Command {
  const cmd = commandFactory("produce");
  cmd.alias("p").description("Produce messages to a queue or an exchange");

  cmd.addCommand(buildSendToQueueCommand());
  cmd.addCommand(buildPublishToExchangeCommand());

  return cmd;
}
