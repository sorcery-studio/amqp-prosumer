import { Debugger } from "debug";
import * as amqplib from "amqplib";
import { Channel, Connection } from "amqplib";

export async function connectToBroker(
  url: string,
  log: Debugger
): Promise<{ connection: Connection; channel: Channel }> {
  const connection = await amqplib.connect(url);
  log("Connection to %s established", url);

  const channel = await connection.createChannel();
  log("Channel created");

  channel.on("close", (serverError?) => {
    log("Channel#close()");

    if (serverError) {
      log("Server Error Received", serverError);
    }
  });

  channel.on("error", (err) => {
    log("Channel#error()", err);
  });

  channel.on("return", (msg) => {
    log("Channel#return()", msg);
  });

  channel.on("drain", () => {
    log("Channel#drain()");
  });

  channel.on("blocked", (reason) => {
    log("Channel#blocked()", reason);
  });

  channel.on("unblocked", (reason) => {
    log("Channel#blocked()", reason);
  });

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

  log("Shutting down the connection");
  await connection.close();
  log("Shutdown completed");
}
