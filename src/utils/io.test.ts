import { readInputFile } from "./io";

jest.mock("fs", () => {
  return {
    readFileSync: jest.fn(() => "line-1\nline-2"),
  };
});

describe("I/O utilities - STDIN input reader", () => {
  test("it yields a each line of the input file (with provided input file)", () => {
    const lines = [];

    for (const line of readInputFile("some-artificial-file.txt")) {
      lines.push(line);
    }

    expect(lines).toEqual(["line-1", "line-2"]);
  });

  test("it yields a each line of the input file (without provided input file)", () => {
    const lines = [];

    for (const line of readInputFile()) {
      lines.push(line);
    }

    expect(lines).toEqual(["line-1", "line-2"]);
  });
});
