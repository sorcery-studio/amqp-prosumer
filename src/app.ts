import { buildConsumeCommand } from "./commands/consume";
import { buildProduceCommand } from "./commands/produce";
import { CommandFactoryFn, reportErrorAndExit } from "./commands/common";

export function createAndRun(
  version: string,
  createCommand: CommandFactoryFn
): void {
  const program = createCommand();

  program.version(version);

  program.addCommand(buildConsumeCommand(createCommand));
  program.addCommand(buildProduceCommand(createCommand));

  program.parseAsync(process.argv).catch(reportErrorAndExit);
}
