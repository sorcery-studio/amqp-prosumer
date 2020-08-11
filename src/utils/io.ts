import fs from "fs";

export type InputProviderFn = (
  inputFile?: string | number
) => Generator<string>;

export const readInput: InputProviderFn = function* (
  inputFile: string | number = 0
) {
  const messages = fs
    .readFileSync(inputFile, "utf-8")
    .split("\n")
    .filter((message) => message !== "");

  for (const message of messages) {
    yield message;
  }
};
