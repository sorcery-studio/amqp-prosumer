import fs from "fs";

export type InputReaderGen = (inputFile?: string | number) => Generator<string>;

const STDIN = 0;

/**
 * Reads the input file and yields each line separately
 *
 * @param inputFile The input file to read. If not provided, STDIN will be used
 *
 * @returns String representing a line of input
 */
export const readInputFile: InputReaderGen = function* (
  inputFile: string | number = STDIN
): Generator<string> {
  const messages = fs
    .readFileSync(inputFile, "utf-8")
    .split("\n")
    .filter((message) => message !== "");

  for (const message of messages) {
    yield message;
  }
};
