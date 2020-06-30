import { Debugger } from "debug";
import * as amqplib from "amqplib";
import { Channel, Connection } from "amqplib";

interface BrokerConnection {
  connection: Connection;
  channel: Channel;
}

export async function connectToBroker(
  url: string,
  log: Debugger
): Promise<BrokerConnection> {
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

export async function disconnectFromBroker(
  broker: BrokerConnection,
  log: Debugger
): Promise<void> {
  log("Closing channel");
  await broker.channel.close();
  log("Channel closed");

  log("Shutting down the connection");
  await broker.connection.close();
  log("Shutdown completed");
}
