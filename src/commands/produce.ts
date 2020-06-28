import {Command} from "commander";
import {CommandFactoryFn} from "./common";
import {actionProduce, commandToOptions} from "./actions/produce";

export function buildProduceCommand(createCommand: CommandFactoryFn): Command {
    const produceCommand = createCommand("produce");

    produceCommand.option("-h, --host [url]", "The URL to the RabbitMQ instance", "amqp://localhost");
    produceCommand.option("-e, --exchange [name]", "The name of exchange to publish to");
    produceCommand.option("-q, --queue [name]", "The name of the queue to publish to");

    produceCommand.action((cmd: Command) => {
        actionProduce(commandToOptions(cmd))
            .catch((err) => console.error("Command execution failure", err));
    });

    return produceCommand;
}
