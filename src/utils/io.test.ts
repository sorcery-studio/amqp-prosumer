import { readInputFile } from "./io";
import * as fs from "fs";

describe("I/O utilities - STDIN input reader", () => {
  test("it yields a each line of the input file", () => {
    const lines = [];

    const inputFile = fs.realpathSync("./src/__mocks__/testInputFile.txt");
    for (const line of readInputFile(inputFile)) {
      lines.push(line);
    }

    expect(lines).toEqual(["line-1", "line-2"]);
  });
});
