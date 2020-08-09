import { buildConsumeCommand } from "./commands/consume";
import { buildProduceCommand } from "./commands/produce";
import { CommandFactoryFn, reportErrorAndExit } from "./commands/common";

export function createAndRun(
  version: string,
  cmdFactory: CommandFactoryFn
): void {
  const program = cmdFactory();

  program.version(version);

  program.addCommand(buildConsumeCommand(cmdFactory));
  program.addCommand(buildProduceCommand(cmdFactory));

  program.parseAsync(process.argv).catch(reportErrorAndExit);
}
