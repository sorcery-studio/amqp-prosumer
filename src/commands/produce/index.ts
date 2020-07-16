import { Command } from "commander";
import { CommandFactoryFn } from "../common";
import { buildProduceToQueueCommand } from "./to-queue.command";
import { buildProduceToExchangeCommand } from "./to-exchange.command";

export function buildProduceCommand(commandFactory: CommandFactoryFn): Command {
  const consumeCommand = commandFactory("produce");

  consumeCommand.addCommand(buildProduceToQueueCommand());
  consumeCommand.addCommand(buildProduceToExchangeCommand());

  return consumeCommand;
}
