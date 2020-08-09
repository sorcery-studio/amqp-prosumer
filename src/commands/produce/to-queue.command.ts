import { Command, program } from "commander";
import { actionProduceQueue } from "./to-queue.action";
import { reportErrorAndExit } from "../common";

export interface ProduceToQueueCommand extends Command {
  queueName: string;
  assert: boolean;
  durable: boolean;
}

export function buildProduceToQueueCommand(): ProduceToQueueCommand {
  return program
    .command("to-queue <name>")
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
    .action((exchangeName: string, options: ProduceToQueueCommand) => {
      actionProduceQueue(exchangeName, options).catch(reportErrorAndExit);
    }) as ProduceToQueueCommand;
}
