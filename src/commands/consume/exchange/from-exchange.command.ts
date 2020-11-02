import { Command, program } from "commander";
import { actionConsumeExchange } from "./from-exchange.action";
import { reportErrorAndExit } from "../../common";

export interface IConsumeFromExchangeCommand extends Command {
  url: string;
  assert: boolean;
  durable: boolean;
}

export function buildConsumeFromExchangeCommand(): IConsumeFromExchangeCommand {
  return program
    .command("from-exchange <exchangeName>")
    .alias("exchange")
    .description("Consume messages published to a exchange")
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
    .action((exchangeName: string, options: IConsumeFromExchangeCommand) => {
      actionConsumeExchange(exchangeName, options).catch(reportErrorAndExit);
    }) as IConsumeFromExchangeCommand;
}
