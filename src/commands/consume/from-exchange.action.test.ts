import { Command } from "commander";
import * as amqp from "amqplib";
import fs from "fs";
import {
  actionConsumeExchange,
  ConsumerFn,
  createConsumerCallback,
  defOnMessage,
} from "./from-exchange.action";
import { Channel, ConsumeMessage } from "amqplib";
import { Debugger } from "debug";

jest.unmock("amqplib");

jest.mock("fs");

const log = (jest.fn() as unknown) as Debugger;

describe("Consume From Exchange Action", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("it consumes a message which is sent to the exchange and writes it as a new line to STDIO", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      uri: "amqp://localhost",
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();

    const onMessage: ConsumerFn = async (msg) => {
      expect(msg.content.toString()).toEqual("test-message");
      await stopConsume();
      await ch.close();
      await conn.close();
      done();
    };

    const stopConsume = await actionConsumeExchange(
      "test-exchange",
      (cmd as unknown) as Command,
      onMessage
    );

    ch.publish("test-exchange", "", Buffer.from("test-message"));

    await ch.waitForConfirms();
  });

  test("create consumer callback logs when the callback is called with null", () => {
    const ch = ({
      ack: jest.fn(),
    } as unknown) as Channel;

    const onMessage = jest.fn();
    const callback = createConsumerCallback(log, ch, onMessage);

    callback(null);

    expect(log).toBeCalledWith("Consumer cancelled by server");
    expect(ch.ack).not.toBeCalled();
    expect(onMessage).not.toBeCalled();
  });

  test.todo(
    "uses the default implementation of message handler (which writes files)"
  );

  test("defOnMessage writes file to system", () => {
    defOnMessage({ content: Buffer.from("example-message") } as ConsumeMessage);
    expect(fs.writeFileSync).toBeCalledWith(1, "example-message\n");
  });
});
