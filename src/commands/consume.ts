import {createCommand, Command} from "commander";
import * as amqplib from "amqplib";
import {ConsumeMessage} from "amqplib";

export const consumeCommand = createCommand("consume");

consumeCommand.option("-h, --host <url>", "The URL to the RabbitMQ instance", "amqp://localhost");
consumeCommand.option("-e, --exchange [name]", "The name of exchange to assert");
consumeCommand.option("-q, --queue <name>", "The name of the queue to assert", "");
// consumeCommand.option("-o, --outFile <name>", "The file which should contain the consumed messages (one per line)");

consumeCommand.action(async (command: Command) => {
    const connection = await amqplib.connect(command.host);
    const channel = await connection.createChannel();

    let exchange;
    let queue;

    if (command.exchange) {
        exchange = await channel.assertExchange(command.exchange, "topic");
        queue = await channel.assertQueue(command.queue, {durable: false, autoDelete: true});
        await channel.bindQueue(queue.queue, exchange.exchange, "#");
    } else if (command.queue) {
        queue = await channel.assertQueue(command.queue, {durable: false, autoDelete: true});
    }

    if (!queue) {
        console.error("No queue to bind to. Bye!");
        await connection.close();
        return;
    }

    const {consumerTag} = await channel.consume(queue.queue, (msg: ConsumeMessage | null) => {
        if (!msg) {
            console.log("Consumer cancelled");
            return;
        }

        console.log(msg.content.toString());
    });

    const shutdown = async () => {
        console.log("Shutting down the consumer");
        await channel.cancel(consumerTag);
        // ToDo: clean exchange and queue?
        await connection.close();
        console.log("Shutdown completed");
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", shutdown);
    process.on("unhandledRejection", shutdown);
});
