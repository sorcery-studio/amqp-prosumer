import { createCommand, Command } from "commander";
import { buildConsumeCommand } from "./";
import { CommandFactoryFn } from "../common";

describe("Consume Command", () => {
  let consume: Command;

  beforeEach(() => {
    consume = buildConsumeCommand(createCommand as CommandFactoryFn);
  });

  test("it returns a command object as a result", () => {
    expect(consume).toBeInstanceOf(Command);
  });

  test("it defines the from-queue sub-command", () => {
    expect(consume.commands.some((cmd) => cmd.name() === "from-queue")).toEqual(
      true
    );
  });

  test("it defines the from-exchange sub-command", () => {
    expect(
      consume.commands.some((cmd) => cmd.name() === "from-exchange")
    ).toEqual(true);
  });
});
