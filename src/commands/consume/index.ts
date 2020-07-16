import { Command } from "commander";
import { CommandFactoryFn } from "../common";
import { buildConsumeFromQueueCommand } from "./from-queue.command";
import { buildConsumeFromExchangeCommand } from "./from-exchange.command";

export function buildConsumeCommand(commandFactory: CommandFactoryFn): Command {
  const consumeCommand = commandFactory("consume");

  consumeCommand.addCommand(buildConsumeFromQueueCommand());
  consumeCommand.addCommand(buildConsumeFromExchangeCommand());

  return consumeCommand;
}
