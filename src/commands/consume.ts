import { Command } from "commander";
import { CommandFactoryFn } from "./common";
import { actionConsume } from "./actions/consume";

export function buildConsumeCommand(commandFactory: CommandFactoryFn): Command {
  const consumeCommand = commandFactory("consume");

  consumeCommand.option(
    "-h, --host [url]",
    "The URL to the RabbitMQ instance",
    "amqp://localhost"
  );

  consumeCommand.option(
    "-e, --exchange [name]",
    "The name of exchange to assert"
  );

  consumeCommand.option(
    "-q, --queue [name]",
    "The name of the queue to assert",
    ""
  );

  consumeCommand.action((cmd: Command) => {
    actionConsume(cmd).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("ERROR: ", err);
      process.exit(1);
    });
  });

  return consumeCommand;
}
