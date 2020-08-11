import fs from "fs";

export type InputProviderFn = () => Generator<string>;

export const readInput: InputProviderFn = function* () {
  if (process.stdin.isTTY) {
    throw new Error("No input provided over STDIN");
  }

  const messages = fs
    .readFileSync(0, "utf-8")
    .split("\n")
    .filter((message) => message !== "");

  for (const message of messages) {
    yield message;
  }
};
