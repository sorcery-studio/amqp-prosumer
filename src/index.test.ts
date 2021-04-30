import * as fs from "fs";

const mockParseAsync = jest.fn(() => Promise.resolve());

const mockCreateApp = jest.fn(() => {
  return {
    parseAsync: mockParseAsync,
  };
});

jest.mock("./app", () => {
  return {
    createApp: mockCreateApp,
  };
});

describe("Index", () => {
  test("it contains the shebang line", () => {
    // Try to get the "built JS file first
    if (fs.existsSync("./index.js")) {
      const script = fs.readFileSync("./index.js").toString();
      expect(script).toContain("#!/usr/bin/env node");
    } else {
      const script = fs.readFileSync("./src/index.ts").toString();
      expect(script).toContain("#!/usr/bin/env node");
    }
  });

  test("it runs the main command", () => {
    // eslint-disable-next-line node/no-missing-require
    require("./index");
    expect(mockCreateApp).toBeCalled();
    expect(mockParseAsync).toBeCalled();
  });
});
