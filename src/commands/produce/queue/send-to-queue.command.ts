import { Command, program } from "commander";
import { actionProduceQueue } from "./send-to-queue.action";

export interface ISendToQueueCommand extends Command {
  url: string;
  assert: boolean;
  durable: boolean;
  autoDelete: boolean;
}

export function buildSendToQueueCommand(): ISendToQueueCommand {
  return program
    .command("send-to-queue <name>")
    .alias("queue")
    .description("Sends messages to a defined queue")
    .option(
      "-u, --url <url>",
      "The URL to the RabbitMQ instance",
      "amqp://localhost"
    )
    .option(
      "-a, --assert",
      "Perform assertion of the queue before binding to it",
      false
    )
    .option(
      "-d, --durable",
      "Mark the resulting queue as 'durable' which will make it survive broker restarts",
      false
    )
    .option("--autoDelete", "Marks the used queue for automatic deletion", true)
    .action(actionProduceQueue) as ISendToQueueCommand;
}
