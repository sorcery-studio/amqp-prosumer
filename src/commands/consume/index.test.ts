import { createCommand, Command } from "commander";
import { buildConsumeCommand } from "./";
import { CommandFactoryFn } from "../common";

describe("Consume Command", () => {
  const consume = buildConsumeCommand(createCommand as CommandFactoryFn);

  test("it defines the command, it's alias and description", () => {
    expect(consume).toBeInstanceOf(Command);
    expect(consume.alias()).toEqual("c");
    expect(consume.description()).toEqual(
      "Consume messages from a queue or an exchange"
    );
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
