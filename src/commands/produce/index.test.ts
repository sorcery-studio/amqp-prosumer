import { createCommand, Command } from "commander";
import { buildProduceCommand } from "./";
import { CommandFactoryFn } from "../common";

describe("Produce Command", () => {
  const consume = buildProduceCommand(createCommand as CommandFactoryFn);

  test("it returns a command object as a result", () => {
    expect(consume).toBeInstanceOf(Command);
  });

  test("it defines the to-queue sub-command", () => {
    expect(consume.commands.some((cmd) => cmd.name() === "to-queue")).toEqual(
      true
    );
  });

  test("it defines the to-exchange sub-command", () => {
    expect(
      consume.commands.some((cmd) => cmd.name() === "to-exchange")
    ).toEqual(true);
  });
});
