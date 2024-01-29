import { createCommand, Command } from "commander";
import { buildProduceCommand } from "./";
import { CommandFactoryFn } from "../common";

describe("Produce Command", () => {
  const produce = buildProduceCommand(createCommand as CommandFactoryFn);

  test("it defines the command, it's alias and description", () => {
    expect(produce).toBeInstanceOf(Command);
    expect(produce.alias()).toEqual("p");
    expect(produce.description()).toEqual(
      "Produce messages to a queue or an exchange",
    );
  });

  test("it defines the to-queue sub-command", () => {
    expect(
      produce.commands.some((cmd) => cmd.name() === "send-to-queue"),
    ).toEqual(true);
  });

  test("it defines the to-exchange sub-command", () => {
    expect(
      produce.commands.some((cmd) => cmd.name() === "publish-to-exchange"),
    ).toEqual(true);
  });
});
