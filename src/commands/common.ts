import {Command} from "commander";

export interface ICommandFactory {
    (name?: string): Command
}
