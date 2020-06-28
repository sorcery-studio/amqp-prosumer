import { buildConsumeCommand } from "./commands/consume";
import { buildProduceCommand } from "./commands/produce";
import { CommandFactoryFn } from "./commands/common";

export function createAndRun(
  version: string,
  createCommand: CommandFactoryFn
): void {
  const program = createCommand();

  program.version(version);

  program.addCommand(buildConsumeCommand(createCommand));
  program.addCommand(buildProduceCommand(createCommand));

  program.parseAsync(process.argv).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  });
}
