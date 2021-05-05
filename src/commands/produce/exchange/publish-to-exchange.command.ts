import commander from "commander";
import { reportErrorAndExit } from "../../common";
import {
  actionProduceExchange,
  IPublishToExchangeCommandOptions,
} from "./publish-to-exchange.action";

export function buildPublishToExchangeCommand(): commander.Command {
  const program = new commander.Command("publish-to-exchange");

  program
    .arguments("<name>")
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
    .option(
      "--confirm",
      "Use publisher confirms to wait for the broker to confirm if the message was handled",
      false
    )
    .action(
      (exchangeName: string, options: IPublishToExchangeCommandOptions) => {
        try {
          actionProduceExchange(exchangeName, options);
        } catch (err) {
          reportErrorAndExit(err);
        }
      }
    );

  return program;
}
