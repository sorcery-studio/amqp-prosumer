import { Command } from "commander";
import { CommandFactoryFn } from "../common";
import { buildPublishToExchangeCommand } from "./exchange/publish-to-exchange.command";
import { buildSendToQueueCommand } from "./queue/send-to-queue.command";

export function buildProduceCommand(commandFactory: CommandFactoryFn): Command {
  const consumeCommand = commandFactory("produce");

  consumeCommand.addCommand(buildSendToQueueCommand());
  consumeCommand.addCommand(buildPublishToExchangeCommand());

  return consumeCommand;
}
