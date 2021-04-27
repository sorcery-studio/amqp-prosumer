import { buildSendToQueueCommand } from "./send-to-queue.command";

describe("Produce To Queue Command", () => {
  const command = buildSendToQueueCommand();

  test("it defines the command, alias and description", () => {
    expect(command.name()).toEqual("send-to-queue");
    expect(command.alias()).toEqual("queue");
    expect(command.description()).toEqual("Sends messages to a defined queue");
  });

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(command).commandToHaveOption("url", "amqp://localhost");
  });

  test("it allows to perform an assertion of a queue", () => {
    expect(command).commandToHaveOption("assert", false);
  });

  test("it allows to specify if the queue is 'durable", () => {
    expect(command).commandToHaveOption("durable", false);
  });

  test("it allows to specify if the queue is automatically deleted", () => {
    expect(command).commandToHaveOption("autoDelete", true);
  });

  test("it allows to specify if publisher-confirms should be used", () => {
    expect(command).commandToHaveOption("confirm", false);
  });
});
