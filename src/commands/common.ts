import { Command } from "commander";

export type CommandFactoryFn = (name?: string | undefined) => Command;
