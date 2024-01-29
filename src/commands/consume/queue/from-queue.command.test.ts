import { buildConsumeFromQueueCommand } from "./from-queue.command";

describe("Consume From Queue Command", () => {
  const command = buildConsumeFromQueueCommand();

  test("it defines the command, its alias and description", () => {
    expect(command.alias()).toEqual("queue");
    expect(command.description()).toEqual(
      "Consume messages from a defined queue",
    );
  });

  test("it defines the 'url' option, default 'amqp://localhost'", () => {
    expect(command).commandToHaveOption("url", "amqp://localhost");
  });

  test("it allows to perform an assertion of a queue", () => {
    expect(command).commandToHaveOption("assert", false);
  });

  test("it allows to specify if the queue is 'exclusive'", () => {
    expect(command).commandToHaveOption("exclusive", false);
  });

  test("it allows to specify if the queue is 'durable", () => {
    expect(command).commandToHaveOption("durable", false);
  });

  test("it allows to specify if the queue is deleted automatically", () => {
    expect(command).commandToHaveOption("autoDelete", true);
  });
});
