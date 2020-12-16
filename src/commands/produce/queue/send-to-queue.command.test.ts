import { buildSendToQueueCommand } from "./send-to-queue.command";

describe("Produce To Queue Command", () => {
  const command = buildSendToQueueCommand();

  test("it defines the command, alias and description", () => {
    expect(command.name()).toEqual("send-to-queue");
    expect(command.alias()).toEqual("queue");
    expect(command.description()).toEqual("Sends messages to a defined queue");
  });

  const options = Object.keys(command.opts());

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(options).toContain("url");
    expect(command.url).toEqual("amqp://localhost");
  });

  test("it allows to perform an assertion of a queue", () => {
    expect(options).toContain("assert");
    expect(command.assert).toEqual(false);
  });

  test("it allows to specify if the queue is 'durable", () => {
    expect(options).toContain("durable");
    expect(command.durable).toEqual(false);
  });

  test("it allows to specify if the queue is automatically deleted", () => {
    expect(options).toContain("autoDelete");
    expect(command.autoDelete).toEqual(true);
  });

  test("it allows to specify if publisher-confirms should be used", () => {
    expect(options).toContain("confirm");
    expect(command.confirm).toEqual(false);
  });
});
