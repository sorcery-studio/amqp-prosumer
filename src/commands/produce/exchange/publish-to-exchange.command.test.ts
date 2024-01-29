import { buildPublishToExchangeCommand } from "./publish-to-exchange.command";

describe("Produce To Exchange Command", () => {
  const command = buildPublishToExchangeCommand();

  test("it defines the command, alias and description", () => {
    expect(command.name()).toEqual("publish-to-exchange");
    expect(command.alias()).toEqual("exchange");
    expect(command.description()).toEqual(
      "Publishes messages to the defined exchange",
    );
  });

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(command).commandToHaveOption("url", "amqp://localhost");
  });

  test("it allows to perform an assertion of a exchange, default false", () => {
    expect(command).commandToHaveOption("assert", false);
  });

  test("it allows to specify if the exchange is durable, default false", () => {
    expect(command).commandToHaveOption("durable", false);
  });

  test("it allows to specify the type of the exchange, default 'topic'", () => {
    expect(command).commandToHaveOption("exchangeType", "topic");
  });

  test("it allows to specify the routing key to use while publishing, default ''", () => {
    expect(command).commandToHaveOption("routingKey", "");
  });

  test("it allows to specify the headers which will be set on the published message", () => {
    expect(command).not.commandToHaveOption("headers");
  });

  test("it allows to specify if publisher-confirms should be used", () => {
    expect(command).commandToHaveOption("confirm", false);
  });
});
