import { actionProduceQueue } from "./send-to-queue.action";
import { InputReaderGen } from "../../../utils/io";
import { connectTestAsConsumer } from "../../../utils/connected-test";
import { ISendToQueueCommand } from "./send-to-queue.command";

jest.unmock("amqplib");

describe.skip("Produce To Queue Action Tests", () => {
  async function runAndAssert(
    cmd: ISendToQueueCommand,
    done: jest.DoneCallback
  ): Promise<void> {
    const {
      runAndListenForMessage,
      disconnectTestFromBroker,
    } = await connectTestAsConsumer({
      queueName: "test-queue-producer",
    });

    const readInput: InputReaderGen = function* () {
      yield "test-message";
    };

    await runAndListenForMessage(
      () => actionProduceQueue("test-queue-producer", cmd, readInput),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  }

  test("it sends a message to the appointed queue", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
      confirm: false,
    } as ISendToQueueCommand;

    await runAndAssert(cmd, done);
  });

  test("it sends a message to the appointed queue with confirm mode", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
      confirm: true,
    } as ISendToQueueCommand;

    await runAndAssert(cmd, done);
  });
});
