import {buildConsumeCommand} from "./commands/consume";
import {buildProduceCommand} from "./commands/produce";
import {ICommandFactory} from "./commands/common";

export function createAndRun(version: string, createCommand: ICommandFactory): void {
    const program = createCommand();

    program.version(version);

    program.addCommand(buildConsumeCommand(createCommand));
    program.addCommand(buildProduceCommand(createCommand));

    program.parseAsync(process.argv).catch((err) => console.error(err));
}
