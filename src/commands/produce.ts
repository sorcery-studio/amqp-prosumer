import fs from "fs";
import {debug} from "debug";
import {Command} from "commander";
import * as amqplib from "amqplib";
import {ICommandFactory} from "./common";
import {Channel} from "amqplib";

const log = debug("amqp-prosumer:producer");

type SenderFn = (message: string) => boolean;

async function publishToExchange(channel: Channel, exchange: string) {
    const ex = await channel.assertExchange(exchange, "topic");
    log("Target exchange %s asserted", ex.exchange);

    return readInputAndSend((message) => {
        return channel.publish(
            ex.exchange,
            "",
            Buffer.from(JSON.stringify(message))
        )
    });
}

function readInputAndSend(fnSender: SenderFn) {
    fs.readFileSync(0, "utf-8")
        .split("\n")
        .filter(message => message !== "")
        .forEach((message: string) => {
            log("Publishing message '%s'", message);
            const success = fnSender(message);
            if (!success) {
                log("ERROR: The message was not published");
            }
        });
}

async function publishToQueue(channel: Channel, queue: string) {
    const q = await channel.assertQueue(queue, {durable: false, autoDelete: true});
    log("Target queue %s asserted", q.queue);

    return readInputAndSend((message) => {
        return channel.sendToQueue(
            q.queue,
            Buffer.from(JSON.stringify(message))
        )
    });
}

function createAction() {
    return async (command: Command) => {
        log("Staring the producer process");

        if (!command.exchange && !command.queue) {
            throw new Error("Either exchange or queue have to be specified");
        }

        const connection = await amqplib.connect(command.host);
        log("Connection to %s established", command.host);

        const channel = await connection.createChannel();
        log("Channel created");

        if (command.exchange) {
            await publishToExchange(channel, command.exchange);
        } else {
            await publishToQueue(channel, command.queue);
        }

        // Just to be sure that data has been sent-out
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
    produceCommand.option("-e, --exchange [name]", "The name of exchange to publish to");
    produceCommand.option("-q, --queue [name]", "The name of the queue to publish to");

    produceCommand.action(createAction());

    return produceCommand;
}
