import { Command } from "commander";
import {
  actionProduce,
  commandToOptions,
  InputProvider,
  ProduceOptions,
} from "./produce";

const fnTestInput: InputProvider = async (onMessage) => {
  ["messageA", "messageB"].forEach((msg) => onMessage(msg));
};

describe("Produce Action", () => {
  test("it's able to send a message to a queue", async () => {
    const opts: ProduceOptions = {
      host: {
        url: "amqp://localhost",
      },
      queue: {
        name: "example-queue",
      },
    };

    const result = await actionProduce(opts, fnTestInput);

    expect(result).toEqual(true);
  });

  test("it's able to send a message to an exchange", async () => {
    const opts: ProduceOptions = {
      host: {
        url: "amqp://localhost",
      },
      exchange: {
        name: "ExampleExchange",
      },
    };

    const result = await actionProduce(opts, fnTestInput);

    expect(result).toEqual(true);
  });

  describe("Command to Options", () => {
    test("it handles the host, queue and exchange command parameters", () => {
      const cmd = ({
        host: "amqp://example",
        queue: "example-queue",
        exchange: "example-exchange",
      } as unknown) as Command;

      const opts = commandToOptions(cmd);

      expect(opts.host.url).toEqual(cmd.host);
      expect(opts.exchange?.name).toEqual(cmd.exchange);
      expect(opts.queue?.name).toEqual(cmd.queue);
    });

    test("it throws an error if the user does not specify queue or exchange", () => {
      expect(() => {
        const cmd = ({
          host: "amqp://example",
        } as unknown) as Command;

        commandToOptions(cmd);
      }).toThrow("Either exchange or queue have to be specified");
    });
  });
});
