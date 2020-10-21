import { Command, program } from "commander";
import { actionConsumeQueue } from "./from-queue.action";
import { reportErrorAndExit } from "../common";

export function buildConsumeFromQueueCommand(): Command {
  return program
    .command("from-queue <queueName>")
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
      "-x, --exclusive",
      "Make sure that the queue is going to be 'exclusive' and no other consumer will be able to use it",
      false
    )
    .option(
      "-d, --durable",
      "Mark the resulting queue as 'durable' which will make it survive broker restarts",
      false
    )
    .option(
      "-a, --autoDelete",
      "Mark the resulting queue for automatic delete when if there will be no consumers",
      true
    )
    .action((queueName: string, options: Command) => {
      actionConsumeQueue(queueName, options).catch(reportErrorAndExit);
    }) as Command;
}
