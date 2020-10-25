import * as amqp from "amqplib";
import { actionConsumeExchange } from "./from-exchange.action";
import { Command } from "commander";
import { ConsumeCallback, ConsumeResult } from "../../../utils/amqp-adapter";

jest.unmock("amqplib");

describe("Consume From Exchange Action Integration Tests", () => {
  test("it consumes a message which is sent to the exchange and writes it as a new line to STDIO", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      url: "amqp://localhost",
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();

    const onMessage: ConsumeCallback = async (msg) => {
      await ch.waitForConfirms();
      await ch.close();
      await conn.close();

      if (shutdown) {
        await shutdown();
      }

      expect(msg.content.toString()).toEqual("test-message");

      done();

      return ConsumeResult.ACK;
    };

    const shutdown = await actionConsumeExchange(
      "test-exchange",
      (cmd as unknown) as Command,
      onMessage
    );

    ch.publish("test-exchange", "", Buffer.from("test-message"));
  });
});
