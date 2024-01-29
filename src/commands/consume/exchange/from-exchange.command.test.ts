import { buildConsumeFromExchangeCommand } from "./from-exchange.command";

process.on("unhandledRejection", (rej) => {
  console.error(rej);
});

describe("Consume From Exchange Command", () => {
  const command = buildConsumeFromExchangeCommand();

  test("it defines the command, its alias and description", () => {
    expect(command.alias()).toEqual("exchange");
    expect(command.description()).toEqual(
      "Consume messages published to a exchange",
    );
  });

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(command).commandToHaveOption("url", "amqp://localhost");
  });

  test("it allows to perform an assertion of a exchange", () => {
    expect(command).commandToHaveOption("assert", false);
  });

  test("it allows to specify if the exchange is 'durable", () => {
    expect(command).commandToHaveOption("durable", false);
  });
});
