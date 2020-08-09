import fs from "fs";
import { InputProviderFn } from "../commands/produce/types";

/**
 * Represents a callback which will be called for each message (line) from the input
 */
export type OnMessageFn = (message: string) => Promise<boolean>;

export const readInput: InputProviderFn = (onMessage: OnMessageFn) => {
  if (process.stdin.isTTY) {
    throw new Error("No input provided over STDIN");
  }

  fs.readFileSync(0, "utf-8")
    .split("\n")
    .filter((message) => message !== "")
    .forEach(onMessage);
};
