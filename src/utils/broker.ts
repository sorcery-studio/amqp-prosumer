import { Debugger } from "debug";
import * as amqplib from "amqplib";
import { Channel, Connection } from "amqplib";

interface BrokerConnection {
  connection: Connection;
  channel: Channel;
}

export async function connectToBroker(
  log: Debugger,
  url: string
): Promise<BrokerConnection> {
  const connection = await amqplib.connect(url);
  log("Connection to %s established", url);

  const channel = await connection.createChannel();
  log("Channel created");

  channel.on("close", (serverError?) => {
    log("Channel#close()");

    if (serverError) {
      log("Received Channel#close() with Error", serverError);
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
    log("Channel#unblocked()", reason);
  });

  return { connection, channel };
}

export async function disconnectFromBroker(
  log: Debugger,
  broker: BrokerConnection
): Promise<void> {
  log("Closing channel");
  await broker.channel.close();
  log("Channel closed");

  log("Shutting down the connection");
  await broker.connection.close();
  log("Shutdown completed");
}

/**
 * Helper function which can be used to block execution (sending further messages)
 *   till the 'drain' event is emit form the channel.
 *
 * @param channel The channel to wait for
 */
export async function waitForDrain(channel: Channel): Promise<void> {
  return new Promise((resolve) => {
    channel.once("drain", () => {
      resolve();
    });
  });
}
