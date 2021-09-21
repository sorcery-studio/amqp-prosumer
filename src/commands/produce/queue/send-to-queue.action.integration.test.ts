import { sendToQueueAction } from "./send-to-queue.action";
import { InputReaderGen } from "../../../utils/io";
import { connectTestAsConsumer } from "../../../utils/connected-test";
import { ISendToQueueCommandOptions } from "./send-to-queue.action";

jest.unmock("amqplib");

describe("Produce To Queue Action Tests", () => {
  async function runAndAssert(
    cmd: ISendToQueueCommandOptions,
    done: jest.DoneCallback
  ): Promise<void> {
    const { runAndListenForMessage, disconnectTestFromBroker } =
      await connectTestAsConsumer({
        queueName: "test-queue-producer",
      });

    // eslint-disable-next-line require-yield
    const readInput: InputReaderGen = function* () {
      yield "test-message";
    };

    await runAndListenForMessage(
      () => sendToQueueAction("test-queue-producer", cmd, readInput),
      async (text) => {
        expect(text).toEqual("test-message");
        await disconnectTestFromBroker();
        done();
      }
    );
  }

  test("it sends a message to the appointed queue", async (done) => {
    const cmd = {
      url: "amqp://localhost",
      durable: false,
      autoDelete: true,
      assert: true,
      confirm: false,
    };

    await runAndAssert(cmd, done);
  });

  test("it sends a message to the appointed queue with confirm mode", async (done) => {
    const cmd = {
      url: "amqp://localhost",
      durable: false,
      autoDelete: true,
      assert: true,
      confirm: true,
    };

    await runAndAssert(cmd, done);
  });
});
