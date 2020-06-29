import { Command } from "commander";
import { CommandFactoryFn, reportErrorAndExit } from "./common";
import { actionConsume } from "./actions/consume";

export function buildConsumeCommand(commandFactory: CommandFactoryFn): Command {
  const consumeCommand = commandFactory("consume");

  consumeCommand.option(
    "-h, --host <url>",
    "The URL to the RabbitMQ instance",
    "amqp://localhost"
  );

  consumeCommand.option(
    "-e, --exchange <name>",
    "The name of exchange to assert"
  );

  consumeCommand.option(
    "-q, --queue <name>",
    "The name of the queue to assert",
    ""
  );

  consumeCommand.action((cmd: Command) => {
    actionConsume(cmd).catch(reportErrorAndExit);
  });

  return consumeCommand;
}
