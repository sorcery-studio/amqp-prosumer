import { Command, program } from "commander";
import { reportErrorAndExit } from "../common";
import { actionProduceExchange } from "./to-exchange.action";

export function buildProduceToExchangeCommand(): Command {
  const produce = program
    .command("to-exchange <name>")
    .option(
      "-u, --url <url>",
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
      actionProduceExchange(exchangeName, options).catch(reportErrorAndExit);
    });

  return produce as Command;
}
