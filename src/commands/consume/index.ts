import { Command } from "commander";
import { CommandFactoryFn } from "../common";
import { buildConsumeFromQueueCommand } from "./queue/from-queue.command";
import { buildConsumeFromExchangeCommand } from "./exchange/from-exchange.command";

export function buildConsumeCommand(cmdFactory: CommandFactoryFn): Command {
  const cmd = cmdFactory("consume");
  cmd.alias("c").description("Consume messages from a queue or an exchange");

  cmd.addCommand(buildConsumeFromQueueCommand());
  cmd.addCommand(buildConsumeFromExchangeCommand());

  return cmd;
}
