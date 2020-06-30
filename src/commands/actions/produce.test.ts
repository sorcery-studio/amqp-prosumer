import { Command } from "commander";
import { commandToOptions } from "./produce";

describe("Produce Action Unit Tests", () => {
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
