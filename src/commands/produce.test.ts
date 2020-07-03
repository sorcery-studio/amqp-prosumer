import { createCommand, Command } from "commander";
import { buildProduceCommand } from "./produce";
import { CommandFactoryFn } from "./common";

describe("Produce Command", () => {
  let cmd: Command;

  beforeEach(() => {
    cmd = buildProduceCommand(createCommand as CommandFactoryFn);
  });

  test("it returns a command object as a result", () => {
    expect(cmd).toBeInstanceOf(Command);
  });

  test("it defines the 'uri' option, default 'amqp://localhost'", () => {
    expect(Object.keys(cmd.opts())).toContain("uri");
    expect(cmd.uri).toEqual("amqp://localhost");
  });

  test("it defines the 'queue' option", () => {
    expect(Object.keys(cmd.opts())).toContain("queue");
  });

  test("it defines the 'exchange' option", () => {
    expect(Object.keys(cmd.opts())).toContain("exchange");
  });

  test.todo("it defines an action");
});
