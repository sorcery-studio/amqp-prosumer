import { Debugger } from "debug";
import fs from "fs";

/**
 * Represents a callback which will be called for each message (line) from the input
 */
export type OnMessageFn = (message: string) => Promise<boolean>;

export async function readInput(
  onMessage: OnMessageFn,
  log: Debugger
): Promise<void> {
  log("Reading messages from input");

  if (process.stdin.isTTY) {
    throw new Error("No input provided over STDIN");
  }

  const messagesToSend = fs
    .readFileSync(0, "utf-8")
    .split("\n")
    .filter((message) => message !== "");

  for (const message of messagesToSend) {
    log("Publishing message '%s'", message);
    const success = await onMessage(message);
    if (!success) {
      log("ERROR: The message was not published");
    }
  }

  log("Finished reading input");
}
