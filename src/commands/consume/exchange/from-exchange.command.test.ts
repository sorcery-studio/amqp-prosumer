import { buildConsumeFromExchangeCommand } from "./from-exchange.command";

describe("Consume From Exchange Command", () => {
  const command = buildConsumeFromExchangeCommand();

  test("it defines the command, its alias and description", () => {
    expect(command.alias()).toEqual("exchange");
    expect(command.description()).toEqual(
      "Consume messages published to a exchange"
    );
  });

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(Object.keys(command.opts())).toContain("url");
    expect(command.url).toEqual("amqp://localhost");
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
