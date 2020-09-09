import { Command, program } from "commander";
import { actionProduceQueue } from "./to-queue.action";

export function buildProduceToQueueCommand(): Command {
  return program
    .command("to-queue <name>")
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
    .action(actionProduceQueue) as Command;
}
