import { buildPublishToExchangeCommand } from "./publish-to-exchange.command";

describe("Produce To Exchange Command", () => {
  const command = buildPublishToExchangeCommand();

  test("it defines the command, alias and description", () => {
    expect(command.name()).toEqual("publish-to-exchange");
    expect(command.alias()).toEqual("exchange");
    expect(command.description()).toEqual(
      "Publishes messages to the defined exchange"
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
