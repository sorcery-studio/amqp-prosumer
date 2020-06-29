import { Command } from "commander";

export type CommandFactoryFn = (name?: string | undefined) => Command;

export function reportErrorAndExit(err: Error): never {
  // eslint-disable-next-line no-console
  console.error("ERROR:", err.message);
  process.exit(1);
}
