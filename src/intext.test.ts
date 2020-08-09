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
    if (fs.existsSync("./src/index.js")) {
      const script = fs.readFileSync("./src/index.js").toString();
      expect(script).toContain("#!/usr/bin/env node");
    } else {
      const script = fs.readFileSync("./src/index.ts").toString();
      expect(script).toContain("#!/usr/bin/env node");
    }
  });

  test("it runs the main command", () => {
    // eslint-disable-next-line node/no-missing-require
    require("./index");
    expect(mockCreateAndRun).toBeCalled();
  });
});
