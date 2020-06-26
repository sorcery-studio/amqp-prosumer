import fs from "fs";
import {debug} from "debug";
import {Command} from "commander";
import * as amqplib from "amqplib";
import {ICommandFactory} from "./common";

const log = debug("amqp-prosumer:producer");

function createAction() {
    return async (command: Command) => {
        log("Staring the producer process");

        const connection = await amqplib.connect(command.host);
        log("Connection to %s established", command.host);

        const channel = await connection.createChannel();
        log("Channel created");

        const exchange = await channel.assertExchange(command.exchange, "topic");
        log("Target exchange %s asserted", command.exchange);

        // Read data from STDIN
        fs.readFileSync(0, "utf-8")
            .split("\n")
            .filter(message => message !== "")
            .forEach((message: string) => {
                log("Publishing message '%s'", message);
                const success = channel.publish(
                    exchange.exchange,
                    "",
                    Buffer.from(JSON.stringify(message))
                );

                if (!success) {
                    log("ERROR: The message was not published");
                }
            });


        setTimeout(async () => {
            log("Shutting down the producer");
            await connection.close();
            log("Shutdown completed");
        }, 2000);
    }
}

export function buildProduceCommand(createCommand: ICommandFactory): Command {
    const produceCommand = createCommand("produce");

    produceCommand.option("-h, --host [url]", "The URL to the RabbitMQ instance", "amqp://localhost");
    produceCommand.requiredOption("-e, --exchange [name]", "The name of exchange to publish to");

    produceCommand.action(createAction());

    return produceCommand;
}
