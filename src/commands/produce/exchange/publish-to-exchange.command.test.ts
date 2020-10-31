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

  const options = Object.keys(command.opts());

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(options).toContain("url");
    expect(command.url).toEqual("amqp://localhost");
  });

  test("it allows to perform an assertion of a exchange, default false", () => {
    expect(options).toContain("assert");
    expect(command.assert).toEqual(false);
  });

  test("it allows to specify if the exchange is durable, default false", () => {
    expect(options).toContain("durable");
    expect(command.durable).toEqual(false);
  });

  test("it allows to specify the type of the exchange, default 'topic'", () => {
    expect(options).toContain("exchangeType");
    expect(command.exchangeType).toEqual("topic");
  });

  test("it allows to specify the routing key to use while publishing, default ''", () => {
    expect(options).toContain("routingKey");
    expect(command.routingKey).toEqual("");
  });
});
