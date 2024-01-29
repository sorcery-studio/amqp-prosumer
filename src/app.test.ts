import { createCommand } from "commander";
import { createApp } from "./app";
import { CommandFactoryFn } from "./commands/common";

beforeEach(() => {
  jest.clearAllMocks();
});

const APP_VERSION = "1.0.0";

describe("AMQP ProSumer", () => {
  const app = createApp(APP_VERSION, createCommand as CommandFactoryFn);

  test("it defines the 'consume' and 'produce' commands", () => {
    expect(app.commands.some((cmd) => cmd.name() === "consume")).toEqual(true);

    expect(app.commands.some((cmd) => cmd.name() === "produce")).toEqual(true);
  });

  // test("it parses the command line arguments", () => {
  //   expect(mockCommand.parseAsync).toHaveBeenCalledTimes(1);
  // });
});
