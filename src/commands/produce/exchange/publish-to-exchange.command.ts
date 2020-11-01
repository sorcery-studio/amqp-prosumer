import { Command, program } from "commander";
import { reportErrorAndExit } from "../../common";
import { actionProduceExchange } from "./publish-to-exchange.action";

export function buildPublishToExchangeCommand(): Command {
  const produce = program
    .command("publish-to-exchange <name>")
    .alias("exchange")
    .description("Publishes messages to the defined exchange")
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
    .option(
      "-t, --exchangeType <type>",
      "Set the type of the exchange",
      "topic"
    )
    .option(
      "-r, --routingKey <key>",
      "Set the routing key for each published message",
      ""
    )
    .option("--headers <header...>", "Set the following headers on the message")
    .action((exchangeName: string, options: Command) => {
      actionProduceExchange(exchangeName, options).catch(reportErrorAndExit);
    });

  return produce as Command;
}
