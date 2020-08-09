import { Command, program } from "commander";
import { actionConsumeExchange } from "./from-exchange.action";
import { reportErrorAndExit } from "../common";

export interface ConsumeFromExchangeCommand extends Command {
  uri: string;
  exchangeName: string;
  assert: boolean;
  durable: boolean;
}

export function buildConsumeFromExchangeCommand(): ConsumeFromExchangeCommand {
  return program
    .command("from-exchange <exchangeName>")
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
    .action((exchangeName: string, options: ConsumeFromExchangeCommand) => {
      actionConsumeExchange(exchangeName, options).catch(reportErrorAndExit);
    }) as ConsumeFromExchangeCommand;
}
