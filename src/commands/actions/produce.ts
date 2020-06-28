import * as amqplib from "amqplib";
import {Channel} from "amqplib";
import fs from "fs";
import {debug, Debugger} from "debug";

export type OnMessageFn = (message: string) => Promise<boolean>;
export type InputProvider = (onMessage: OnMessageFn) => Promise<void>;

interface HostOption {
    url: string;
}

interface ExchangeOption {
    name: string;
}

interface QueueOption {
    name: string;
}

export interface ProduceOptions {
    host: HostOption,
    exchange?: ExchangeOption,
    queue?: QueueOption
}

const logger = debug("amqp-prosumer:producer");

async function readInput(onMessage: OnMessageFn, log: Debugger = logger) {
    log("Reading input");

    fs.readFileSync(0, "utf-8")
        .split("\n")
        .filter(message => message !== "")
        .forEach((message: string) => {
            log("Publishing message '%s'", message);
            const success = onMessage(message);
            if (!success) {
                log("ERROR: The message was not published");
            }
        });

    log("Finished reading input");
}

async function publishToExchange(channel: Channel, exchange: string, message: string) {
    return channel.publish(
        exchange,
        "",
        Buffer.from(JSON.stringify(message))
    );
}

async function readAndSendToQueue(channel: Channel, queue: string, message: string) {
    return channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message))
    );
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(() => resolve(), ms);
    });
}

export async function actionProduce(
    target: ProduceOptions,
    fnReadInput: InputProvider = readInput,
    log: Debugger = logger
): Promise<boolean> {
    log("Staring the producer process");

    if (!target.exchange?.name && !target.queue?.name) {
        throw new Error("Either exchange or queue have to be specified");
    }

    const connection = await amqplib.connect(target.host.url);
    log("Connection to %s established", target.host.url);

    const channel = await connection.createChannel();
    log("Channel created");

    if (target.exchange?.name) {
        const ex = await channel.assertExchange(target.exchange.name, "topic");
        log("Target exchange %s asserted", ex.exchange);

        await fnReadInput((message: string) => publishToExchange(channel, ex.exchange, message));

    } else if (target.queue?.name) {
        const q = await channel.assertQueue(target.queue.name, {durable: false, autoDelete: true});
        log("Target queue %s asserted", q.queue);

        await fnReadInput((message: string) => readAndSendToQueue(channel, q.queue, message));
    } else {
        throw new Error("Oh, really?");
    }

    // Important! We shouldn't close the connection - `amqplib` buffers "pending" messages
    // and closing the connection too early leads to rejections
    await delay(2000);

    log("Shutting down the producer");
    await connection.close();
    log("Shutdown completed");

    return true;
}
