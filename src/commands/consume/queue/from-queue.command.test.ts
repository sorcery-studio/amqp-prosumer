import { buildConsumeFromQueueCommand } from "./from-queue.command";

describe("Consume From Queue Command", () => {
  const command = buildConsumeFromQueueCommand();

  test("it defines the command, its alias and description", () => {
    expect(command.alias()).toEqual("queue");
    expect(command.description()).toEqual(
      "Consume messages from a defined queue"
    );
  });

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(Object.keys(command.opts())).toContain("url");
    expect(command.url).toEqual("amqp://localhost");
  });

  test("it allows to perform an assertion of a queue", () => {
    expect(Object.keys(command.opts())).toContain("assert");
    expect(command.assert).toEqual(false);
  });

  test("it allows to specify if the queue is 'exclusive'", () => {
    expect(Object.keys(command.opts())).toContain("exclusive");
    expect(command.exclusive).toEqual(false);
  });

  test("it allows to specify if the queue is 'durable", () => {
    expect(Object.keys(command.opts())).toContain("durable");
    expect(command.durable).toEqual(false);
  });

  test("it allows to specify if the queue is deleted automatically", () => {
    expect(Object.keys(command.opts())).toContain("autoDelete");
    expect(command.autoDelete).toEqual(true);
  });
});
