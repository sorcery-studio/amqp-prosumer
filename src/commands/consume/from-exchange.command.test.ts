import { Command } from "commander";
import { buildConsumeFromExchangeCommand } from "./from-exchange.command";

describe("Consume From Exchange Command", () => {
  let command: Command;

  beforeEach(() => {
    command = buildConsumeFromExchangeCommand();
  });

  test("it defines the 'uri' option, default 'amqp://localhost'", () => {
    expect(Object.keys(command.opts())).toContain("uri");
    expect(command.uri).toEqual("amqp://localhost");
  });

  test("it allows to perform an assertion of a exchange", () => {
    expect(Object.keys(command.opts())).toContain("assert");
    expect(command.assert).toEqual(false);
  });

  test("it allows to specify if the exchange is 'durable", () => {
    expect(Object.keys(command.opts())).toContain("durable");
    expect(command.durable).toEqual(false);
  });
});
