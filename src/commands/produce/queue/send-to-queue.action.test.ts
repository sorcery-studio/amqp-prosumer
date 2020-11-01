import { Command } from "commander";
import { actionProduceQueue } from "./send-to-queue.action";
import { InputReaderGen } from "../../../utils/io";
import { connectTestAsConsumer } from "../../../utils/connected-test";

jest.unmock("amqplib");

describe("Produce To Queue Action", () => {
  test("it sends a message to the appointed queue", async (done) => {
    const cmd = {
      durable: false,
      autoDelete: true,
      assert: true,
    };

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
      () =>
        actionProduceQueue(
          "test-queue-producer",
          (cmd as unknown) as Command,
          readInput
        ),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  });
});
