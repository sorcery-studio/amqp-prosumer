import { Command, program } from "commander";
import { actionConsumeExchange } from "./from-exchange.action";
import { reportErrorAndExit } from "../common";

export function buildConsumeFromExchangeCommand(): Command {
  const consume = program
    .command("from-exchange <name>")
    .option(
      "-u, --uri <uri>",
      "The URL to the RabbitMQ instance",
      "amqp://localhost"
    )
    .option(
      "-a, --assert",
      "Perform assertion of the exchange before binding to it",
      false
    )
    .option(
      "-d, --durable",
      "Mark the resulting exchange as 'durable' which will make it survive broker restarts",
      false
    )
    .action((exchangeName: string, options: Command) => {
      actionConsumeExchange(exchangeName, options).catch(reportErrorAndExit);
    });

  return consume as Command;
}
