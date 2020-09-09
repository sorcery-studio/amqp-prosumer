import { Command } from "commander";
import * as amqp from "amqplib";
import fs from "fs";
import { actionConsumeExchange, defOnMessage } from "./from-exchange.action";
import { ConsumeMessage } from "amqplib";
import { channel } from "../../__mocks__/amqplib";

jest.mock("fs");
jest.mock("amqplib");

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
      url: "amqp://localhost",
    } as unknown) as Command;

    await actionConsumeExchange(exchangeName, options);

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
  });

  test("it connects to the broker, asserts the exchange, queue and binds them", async () => {
    const exchangeName = "test-exchange";
    const options = ({
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      url: "amqp://localhost",
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
      autoDelete: true,
    });

    expect(channel.bindQueue).toBeCalledWith(
      "test-queue",
      "test-exchange",
      "#"
    );
  });

  test("defOnMessage writes file to system", () => {
    defOnMessage({ content: Buffer.from("example-message") } as ConsumeMessage);
    expect(fs.writeFileSync).toBeCalledWith(1, "example-message\n");
  });
});
