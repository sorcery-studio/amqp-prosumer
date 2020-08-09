import { Command } from "commander";
import { buildConsumeCommand } from "./commands/consume";
import { buildProduceCommand } from "./commands/produce";
import { CommandFactoryFn } from "./commands/common";

export function createApp(
  version: string,
  cmdFactory: CommandFactoryFn
): Command {
  const program = cmdFactory();

  program.version(version);

  program.addCommand(buildConsumeCommand(cmdFactory));
  program.addCommand(buildProduceCommand(cmdFactory));

  return program;
}
