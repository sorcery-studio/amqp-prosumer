import { Command } from "commander";
import * as amqp from "amqplib";
import fs from "fs";
import {
  actionConsumeExchange,
  createConsumerCallback,
  defOnMessage,
} from "./from-exchange.action";
import { Channel, ConsumeMessage } from "amqplib";
import { Debugger } from "debug";
import { channel, connection } from "../../__mocks__/amqplib";

jest.mock("fs");
jest.mock("amqplib");

const log = (jest.fn() as unknown) as Debugger;

describe("Consume From Exchange Action Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("it connects to the broker, asserts the queue and binds it to the exchange without assertion", async () => {
    const exchangeName = "test-exchange";
    const options = ({
      assert: false,
      autoDelete: true,
      durable: false,
      exclusive: false,
      uri: "amqp://localhost",
    } as unknown) as Command;

    const stopFn = await actionConsumeExchange(exchangeName, options);

    expect(amqp.connect).toBeCalledWith("amqp://localhost");
    expect(channel.assertQueue).toBeCalledWith("", {
      autoDelete: true,
      durable: false,
      exclusive: true,
    });

    expect(channel.assertExchange).not.toBeCalledWith();
    expect(channel.assertExchange).not.toBeCalledWith(exchangeName, "topic", {
      durable: false,
    });

    expect(channel.bindQueue).toBeCalledWith(
      "test-queue",
      "test-exchange",
      "#"
    );

    expect(channel.consume).toBeCalledWith("test-queue", expect.any(Function));

    expect(stopFn).toBeInstanceOf(Function);

    await stopFn();

    expect(channel.cancel).toBeCalledWith("test-consumer-tag");
    expect(channel.close).toBeCalled();
    expect(connection.close).toBeCalled();
  });

  test("it connects to the broker, asserts the exchange, queue and binds them", async () => {
    const exchangeName = "test-exchange";
    const options = ({
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      uri: "amqp://localhost",
    } as unknown) as Command;

    await actionConsumeExchange(exchangeName, options);

    expect(amqp.connect).toBeCalledWith("amqp://localhost");
    expect(channel.assertQueue).toBeCalledWith("", {
      autoDelete: true,
      durable: false,
      exclusive: true,
    });

    expect(channel.assertExchange).toBeCalledWith(exchangeName, "topic", {
      durable: false,
    });

    expect(channel.bindQueue).toBeCalledWith(
      "test-queue",
      "test-exchange",
      "#"
    );
  });

  test("create consumer callback logs when the callback is called with null", () => {
    const ch = ({
      ack: jest.fn(),
    } as unknown) as Channel;

    const onMessage = jest.fn();
    const callback = createConsumerCallback(log, ch, onMessage);

    callback(null);

    expect(log).toBeCalledWith(
      "Consumer cancelled by server, you should shut down!"
    );
    expect(ch.ack).not.toBeCalled();
    expect(onMessage).not.toBeCalled();
  });

  test("create consumer callback passes the message to onMessage and acks it", () => {
    const ch = ({
      ack: jest.fn(),
    } as unknown) as Channel;

    const onMessage = jest.fn();
    const callback = createConsumerCallback(log, ch, onMessage);

    callback({ content: Buffer.from("example-message") } as ConsumeMessage);

    expect(log).not.toBeCalledWith(
      "Consumer cancelled by server, you should shut down!"
    );
    expect(ch.ack).toBeCalled();
    expect(onMessage).toBeCalled();
  });

  test("defOnMessage writes file to system", () => {
    defOnMessage({ content: Buffer.from("example-message") } as ConsumeMessage);
    expect(fs.writeFileSync).toBeCalledWith(1, "example-message\n");
  });
});
