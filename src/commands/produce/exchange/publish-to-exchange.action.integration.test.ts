import {
  actionProduceExchange,
  IPublishToExchangeCommandOptions,
} from "./publish-to-exchange.action";
import { InputReaderGen } from "../../../utils/io";
import { connectTestAsConsumer } from "../../../utils/connected-test";
import { IConnectionContext, publish } from "../../../utils/amqp-adapter";
import { Options } from "amqplib";
import Publish = Options.Publish;

jest.unmock("amqplib");

const readTestInput: InputReaderGen = function* () {
  yield "test-message";
};

function createCommand(
  opts: Partial<IPublishToExchangeCommandOptions>
): IPublishToExchangeCommandOptions {
  const baseCommand: IPublishToExchangeCommandOptions = {
    url: "amqp://localhost",
    exchangeType: "topic",
    routingKey: "",
    durable: false,
    autoDelete: true,
    assert: true,
    confirm: false,
  };

  return {
    ...baseCommand,
    ...opts,
  };
}

describe("Produce To Exchange Action", () => {
  test("it sends a message to the appointed exchange (topic)", async (done) => {
    const exchangeType = "topic";
    const routingKey = "some-topic";

    const cmd = createCommand({
      exchangeType,
      routingKey,
    });

    const exchangeName = "test-exchange-producer-topic";

    const {
      runAndListenForMessage,
      disconnectTestFromBroker,
    } = await connectTestAsConsumer(
      { queueName: "" },
      {
        exchangeName,
        exchangeType,
        routingKey: "some-topic",
      }
    );

    await runAndListenForMessage(
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  });

  test("it sends a message to the appointed exchange (direct)", async (done) => {
    const exchangeType = "direct";
    const routingKey = "example-key";

    const cmd = createCommand({
      exchangeType,
      routingKey,
    });

    const exchangeName = "test-exchange-producer-direct";

    const {
      runAndListenForMessage,
      disconnectTestFromBroker,
    } = await connectTestAsConsumer(
      { queueName: "" },
      {
        exchangeName,
        exchangeType,
        routingKey,
      }
    );

    await runAndListenForMessage(
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  });

  test("it sends a message to the appointed exchange (fanout)", async (done) => {
    const exchangeType = "fanout";
    const routingKey = "fanout-key";

    const cmd = createCommand({
      exchangeType,
      routingKey,
    });

    const exchangeName = "test-exchange-producer-fanout";

    const {
      runAndListenForMessage,
      disconnectTestFromBroker,
    } = await connectTestAsConsumer(
      { queueName: "" },
      {
        exchangeName,
        exchangeType,
        routingKey,
      }
    );

    await runAndListenForMessage(
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  });

  test("it sends a message to the appointed exchange (headers)", async (done) => {
    const exchangeType = "headers";
    const routingKey = "";
    const cmd = createCommand({
      exchangeType,
      routingKey,
      headers: ["headerA=A", "headerB=B"],
    });

    const exchangeName = "test-exchange-producer-headers";

    const {
      runAndListenForMessage,
      disconnectTestFromBroker,
    } = await connectTestAsConsumer(
      { queueName: "" },
      {
        exchangeName,
        exchangeType,
        routingKey,
        bindArgs: {
          headerA: "A",
          headerB: "B",
        },
      }
    );

    await runAndListenForMessage(
      () => actionProduceExchange(exchangeName, cmd, readTestInput),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  });

  test("it sends a message to the appointed exchange (with confirmation mode)", async (done) => {
    const exchangeType = "direct";
    const routingKey = "example-key";

    const cmd = createCommand({
      exchangeType,
      routingKey,
      confirm: true,
    });

    const exchangeName = "test-exchange-producer-direct-confirm";

    const {
      runAndListenForMessage,
      disconnectTestFromBroker,
    } = await connectTestAsConsumer(
      { queueName: "" },
      {
        exchangeName,
        exchangeType,
        routingKey,
      }
    );

    await runAndListenForMessage(
      () =>
        actionProduceExchange(
          exchangeName,
          cmd,
          readTestInput,
          (
            ctx: IConnectionContext,
            message: string,
            rKey?: string,
            options?: Publish
          ): Promise<IConnectionContext> => {
            expect(ctx.channel).toHaveProperty("waitForConfirms");
            return publish(ctx, message, rKey, options);
          }
        ),
      (text) => {
        expect(text).toEqual("test-message");
        done();
      }
    );

    await disconnectTestFromBroker();
  });
});
