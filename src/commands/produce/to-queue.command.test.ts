import { buildProduceToQueueCommand } from "./to-queue.command";

describe("Produce To Queue Command", () => {
  const command = buildProduceToQueueCommand();

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(Object.keys(command.opts())).toContain("url");
    expect(command.url).toEqual("amqp://localhost");
  });

  test("it allows to perform an assertion of a queue", () => {
    expect(Object.keys(command.opts())).toContain("assert");
    expect(command.assert).toEqual(false);
  });

  test("it allows to specify if the queue is 'durable", () => {
    expect(Object.keys(command.opts())).toContain("durable");
    expect(command.durable).toEqual(false);
  });
});
