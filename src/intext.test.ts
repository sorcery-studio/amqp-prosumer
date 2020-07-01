import * as fs from "fs";

const mockCreateAndRun = jest.fn();

jest.mock("./app", () => {
  return {
    createAndRun: mockCreateAndRun,
  };
});

describe("Index", () => {
  test("it contains the shebang line", () => {
    // Try to get the "built JS file first
    let script = "";

    if (fs.existsSync("./src/index.js")) {
      script = fs.readFileSync("./src/index.js").toString();
    } else {
      script = fs.readFileSync("./src/index.ts").toString();
    }

    expect(script).toContain("#!/usr/bin/env node");
  });
  test("it runs the main command", () => {
    // eslint-disable-next-line node/no-missing-require
    require("./index");
    expect(mockCreateAndRun).toBeCalled();
  });
});
