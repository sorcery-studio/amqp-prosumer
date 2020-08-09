import { Command } from "commander";
import * as amqp from "amqplib";
import { actionConsumeExchange } from "./from-exchange.action";

jest.unmock("amqplib");

describe("Consume From Exchange Action", () => {
  test("it consumes a message which is sent to the exchange", async (done) => {
    const cmd = {
      assert: true,
      autoDelete: true,
      durable: false,
      exclusive: false,
      uri: "amqp://localhost",
    };

    const conn = await amqp.connect("amqp://localhost");
    const ch = await conn.createConfirmChannel();

    const stopConsume = await actionConsumeExchange(
      "test-exchange",
      (cmd as unknown) as Command,
      async (msg) => {
        expect(msg.content.toString()).toEqual("test-message");
        await stopConsume();
        await ch.close();
        await conn.close();
        done();
      }
    );

    ch.publish("test-exchange", "", Buffer.from("test-message"));

    await ch.waitForConfirms();
  });
});
