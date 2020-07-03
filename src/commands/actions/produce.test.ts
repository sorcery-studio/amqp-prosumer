jest.mock("amqplib");

import { Command } from "commander";
import { actionProduce, commandToOptions, InputProvider } from "./produce";
import * as amqplib from "amqplib";

describe("Produce Action Unit Tests", () => {
  describe("Command to Options", () => {
    test("it handles the uri, queue and exchange command parameters", () => {
      const cmd = ({
        uri: "amqp://example",
        queue: "example-queue",
        exchange: "example-exchange",
      } as unknown) as Command;

      const opts = commandToOptions(cmd);

      expect(opts.server.uri).toEqual(cmd.uri);
      expect(opts.exchange?.name).toEqual(cmd.exchange);
      expect(opts.queue?.name).toEqual(cmd.queue);
    });

    test("it throws an error if the user does not specify queue or exchange", () => {
      expect(() => {
        const cmd = ({
          uri: "amqp://example",
        } as unknown) as Command;

        commandToOptions(cmd);
      }).toThrow("Either exchange or queue have to be specified");
    });
  });

  describe("Action", () => {
    const fnTestInput: InputProvider = async (onMessage) => {
      const messages = ["messageA", "messageB"];

      for (const msg of messages) {
        await onMessage(msg);
      }
    };

    test("it closes the channel when disconnecting", async () => {
      const result = await actionProduce(
        {
          server: {
            uri: "amqp://example",
          },
          exchange: { name: "ExampleExchange" },
        },
        fnTestInput
      );

      expect(result).toBe(true);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(amqplib.channel.close).toBeCalled();
    });
  });
});
