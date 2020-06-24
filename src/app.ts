import { program } from "commander";
import {consumeCommand} from "./commands/consume";
import {produceCommand} from "./commands/produce";

export function createAndRun(version: string): void {
    program.version(version);

    program.addCommand(consumeCommand);
    program.addCommand(produceCommand);

    program.parseAsync(process.argv).catch((err) => console.error(err));
}
