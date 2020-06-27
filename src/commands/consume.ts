import fs from "fs";
import {debug} from "debug";
import {Command} from "commander";
import * as amqplib from "amqplib";
import {ConsumeMessage} from "amqplib";
import {CommandFactoryFn} from "./common";

const log = debug("amqp-prosumer:consumer");

type ConsumerFn = (msg: ConsumeMessage) => any;

export const defOnMessage = (msg: ConsumeMessage) => {
    log("Consuming message");

    const write = msg.content
        .toString("utf-8")
        .replace(/^"/, "")
        .replace(/"$/, "");

    fs.writeFileSync(1, write + "\n");

}

function createAction(onMessage: ConsumerFn) {
    return async (command: Command) => {
        log("Staring the consumer process");

        if (!command.exchange && !command.queue) {
            throw new Error("Either exchange or queue have to be specified");
        }

        const connection = await amqplib.connect(command.host);
        log("Connection to %s established", command.host);

        const channel = await connection.createChannel();
        log("Channel created");

        let exchange;
        let queue;

        if (command.exchange) {
            exchange = await channel.assertExchange(command.exchange, "topic");
            log("Exchange %s asserted", exchange.exchange);

            queue = await channel.assertQueue(command.queue, {durable: false, autoDelete: true});
            log("Queue %s asserted", queue.queue);

            await channel.bindQueue(queue.queue, exchange.exchange, "#");
            log("Bound queue %s to exchange", queue.queue, exchange.exchange);
        } else {
            queue = await channel.assertQueue(command.queue, {durable: false, autoDelete: true});
        }

        const {consumerTag} = await channel.consume(queue.queue, (msg) => {
            if (!msg) {
                log("Consumer cancelled");
                return;
            }

            onMessage(msg)

            channel.ack(msg);
        });
        log("Consumer started, input queue %s, consumer tag: %s", queue.queue, consumerTag)

        const shutdown = async () => {
            log("Shutting down the consumer");
            await channel.cancel(consumerTag);
            // ToDo: clean exchange and queue?
            await connection.close();
            log("Shutdown completed");
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
        process.on("uncaughtException", shutdown);
        process.on("unhandledRejection", shutdown);
    };
}

export function buildConsumeCommand(
    commandFactory: CommandFactoryFn,
    onMessage: ConsumerFn = defOnMessage
): Command {
    const consumeCommand = commandFactory("consume");

    consumeCommand.option("-h, --host [url]", "The URL to the RabbitMQ instance", "amqp://localhost");
    consumeCommand.option("-e, --exchange [name]", "The name of exchange to assert");
    consumeCommand.option("-q, --queue [name]", "The name of the queue to assert", "");
    consumeCommand.action(createAction(onMessage));

    return consumeCommand;
}


