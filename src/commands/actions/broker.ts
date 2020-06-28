import { Debugger } from "debug";
import * as amqplib from "amqplib";
import { Channel, Connection } from "amqplib";
import { ProduceOptions } from "./produce";

export async function connectToBroker(
  options: ProduceOptions,
  log: Debugger
): Promise<{ connection: Connection; channel: Channel }> {
  const connection = await amqplib.connect(options.host.url);
  log("Connection to %s established", options.host.url);

  const channel = await connection.createChannel();
  log("Channel created");

  return { connection, channel };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}

export async function disconnectFromBroker(
  connection: Connection,
  log: Debugger
): Promise<void> {
  // Important! We shouldn't close the connection - `amqplib` buffers "pending" messages
  // and closing the connection too early leads to rejections
  await delay(2000);

  log("Shutting down the producer");
  await connection.close();
  log("Shutdown completed");
}
