import commander from "commander";
import { sendToQueueAction } from "./send-to-queue.action";

export function buildSendToQueueCommand(): commander.Command {
  const program = new commander.Command("send-to-queue");

  program
    .arguments("<name>")
    .alias("queue")
    .description("Sends messages to a defined queue")
    .option(
      "-u, --url <url>",
      "The URL to the RabbitMQ instance",
      "amqp://localhost",
    )
    .option(
      "-a, --assert",
      "Perform assertion of the queue before binding to it",
      false,
    )
    .option(
      "-d, --durable",
      "Mark the resulting queue as 'durable' which will make it survive broker restarts",
      false,
    )
    .option("--autoDelete", "Marks the used queue for automatic deletion", true)
    .option(
      "--confirm",
      "Use publisher confirms to wait for the broker to confirm if the message was handled",
      false,
    )
    .action(sendToQueueAction);

  return program;
}
