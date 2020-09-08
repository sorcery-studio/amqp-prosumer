import {
  bindQueueAndExchange,
  cancelConsumer,
  closeChannel,
  connectToBroker,
  consume,
  ConsumeResult,
  createChannel,
  createDefaultChannelEventListeners,
  declareExchange,
  declareQueue,
  disconnectFromBroker,
  IConnectionContext,
  publish,
  sendToQueue,
  wrapMessageHandler,
} from "./amqp-adapter";
import * as amqp from "amqplib";
import { Channel, Connection, ConsumeMessage } from "amqplib";
import { mock, MockProxy } from "jest-mock-extended";

interface MockedIConnectionContext extends IConnectionContext {
  channel: MockProxy<Channel>;
  connection: MockProxy<Connection>;
}

function getCtx(
  ext: Partial<MockedIConnectionContext> = {}
): MockedIConnectionContext {
  return {
    channel: mock<Channel>(),
    connection: mock<Connection>(),
    ...ext,
  };
}

describe("AMQP FP Adapter", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe("Connect to broker function", () => {
    test("It establishes the connection and returns it", async () => {
      const mockConnection = mock<Connection>();

      const connectSpy = jest
        .spyOn(amqp, "connect")
        .mockResolvedValueOnce(mockConnection);

      const conn = await connectToBroker("amqp://localhost");

      expect(connectSpy).toBeCalledWith("amqp://localhost");
      expect(conn).toEqual(mockConnection);
    });
  });

  describe("Disconnect from broker function", () => {
    test("It accepts AMQP connection and calls the close on it", async () => {
      const mockConnection = mock<Connection>();

      const ret = await disconnectFromBroker(mockConnection);

      expect(mockConnection.close).toBeCalled();
      expect(ret).toBeUndefined();
    });
  });

  describe("Create channel function", () => {
    test("It creates new channel for the provided connection, binds events callbacks and provides back connection context", async () => {
      const mockConnection = mock<Connection>();
      const mockChannel = mock<Channel>();

      mockConnection.createChannel.mockResolvedValueOnce(mockChannel);

      const ctx = await createChannel(mockConnection);

      expect(ctx.connection).toEqual(mockConnection);
      expect(ctx.channel).toEqual(mockChannel);

      const events = [
        "close",
        "error",
        "return",
        "drain",
        "blocked",
        "unblocked",
      ];

      events.forEach((event) => {
        expect(mockChannel.on).toBeCalledWith(event, expect.any(Function));
      });
    });
  });

  describe("Close channel", () => {
    test("It calls the close on the channel and returns the connection", async () => {
      const ctx = getCtx();

      const conn = await closeChannel(ctx);

      expect(ctx.channel.close).toBeCalled();
      expect(conn).toBe(ctx.connection);
    });
  });

  describe("Declare queue", () => {
    test("It returns the queue name passed as an argument when assert is set to false", async () => {
      const qName = "test-queue-name";
      const qOpts = { durable: true };
      const assert = false;

      const ctx = getCtx();

      const queueCreator = declareQueue(qName, qOpts, assert);
      const qCtx = await queueCreator(ctx);

      expect(qCtx.queueName).toBe(qName);
      expect(qCtx.connection).toBe(ctx.connection);
      expect(qCtx.channel).toBe(ctx.channel);
      expect(qCtx.channel.assertQueue).not.toBeCalled();
    });

    test("It returns the asserted queue name passed when assert is set to true", async () => {
      const qAssertedName = "name-returned-from-assert";
      const qOpts = { durable: true };
      const assert = true;

      const ctx = getCtx();

      ctx.channel.assertQueue.mockResolvedValueOnce({
        queue: qAssertedName,
        messageCount: 0,
        consumerCount: 1,
      });
      const queueCreator = declareQueue("", qOpts, assert);
      const qCtx = await queueCreator(ctx);

      expect(qCtx.queueName).toBe(qAssertedName);
      expect(qCtx.connection).toBe(ctx.connection);
      expect(qCtx.channel).toBe(ctx.channel);
      expect(qCtx.channel.assertQueue).toBeCalledWith("", qOpts);
    });
  });

  describe("Declare exchange", () => {
    test("It returns the exchange name passed as an argument when assert is set to false", async () => {
      const exName = "test-exchange-name";
      const exOpts = { durable: true };
      const exType = "topic";
      const assert = false;

      const ctx = getCtx();

      const exCreator = declareExchange(exName, exType, exOpts, assert);
      const exCtx = await exCreator(ctx);

      expect(exCtx.exchangeName).toBe(exName);
      expect(exCtx.connection).toBe(ctx.connection);
      expect(exCtx.channel).toBe(ctx.channel);
      expect(exCtx.channel.assertExchange).not.toBeCalled();
    });

    test("It returns the asserted exchange name passed when assert is set to true", async () => {
      const exName = "name-passed-to-assert";
      const exAssertedName = "name-returned-from-assert";
      const exType = "topic";
      const exOpts = { durable: true };
      const assert = true;

      const ctx = getCtx();

      ctx.channel.assertExchange.mockResolvedValueOnce({
        exchange: exAssertedName,
      });
      const exCreator = declareExchange(exName, exType, exOpts, assert);
      const exCtx = await exCreator(ctx);

      expect(exCtx.exchangeName).toBe(exAssertedName);
      expect(exCtx.connection).toBe(ctx.connection);
      expect(exCtx.channel).toBe(ctx.channel);
      expect(exCtx.channel.assertExchange).toBeCalledWith(
        exName,
        exType,
        exOpts
      );
    });
  });

  describe("Bind queue and exchange function", () => {
    test("It binds the queue and exchange present in the context", async () => {
      const correctCtx = getCtx({
        queueName: "test-queue",
        exchangeName: "test-exchange",
      });

      const binder = bindQueueAndExchange();

      const ctx = await binder(correctCtx);

      expect(correctCtx.channel.bindQueue).toBeCalledWith(
        correctCtx.queueName,
        correctCtx.exchangeName,
        "#"
      );

      expect(ctx).toBe(correctCtx);
    });

    test.each(["queueName", "exchangeName"])(
      "It throws an exception when the context is missing %s property",
      async (undefProp) => {
        const correctCtx = getCtx({
          queueName: "test-queue",
          exchangeName: "test-exchange",
        });

        const binder = bindQueueAndExchange();

        await expect(
          binder({
            ...correctCtx,
            [undefProp]: undefined,
          })
        ).rejects.toThrow(
          "Cloud not bind queue with exchange, because one of the names is missing"
        );

        expect(correctCtx.channel.bindQueue).not.toBeCalled();
      }
    );
  });

  describe("Consume function", () => {
    test("It returns a consumer context - containing the consumer tag, uses provided onMessage function", async () => {
      const qName = "test-queue-name";

      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
        queueName: qName,
      };

      ctx.channel.consume.mockResolvedValue({
        consumerTag: "test-consumer-tag",
      });

      const onMessage = jest.fn();
      const wrapResult = jest.fn();
      const testWrapper = jest.fn().mockReturnValue(wrapResult);
      const startConsumer = consume(onMessage, testWrapper);

      // Start the consumer
      const consContext = await startConsumer(ctx);

      expect(consContext.consumerTag).toEqual("test-consumer-tag");
      expect(onMessage).not.toBeCalled();
      expect(testWrapper).toBeCalledWith(consContext.channel, onMessage);
      expect(consContext.channel.consume).toBeCalledWith(qName, wrapResult);
    });

    test("Throws an error when the connection context does not contain a queue to consume", async () => {
      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
      };

      const onMessage = jest.fn();
      const wrapResult = jest.fn();
      const testWrapper = jest.fn().mockReturnValue(wrapResult);
      const startConsumer = consume(onMessage, testWrapper);

      // Start the consumer
      await expect(startConsumer(ctx)).rejects.toThrow("Missing queue name");

      expect(onMessage).not.toBeCalled();
      expect(testWrapper).not.toBeCalled();
      expect(ctx.channel.consume).not.toBeCalled();
    });
  });

  describe("Wrap message handler function", () => {
    test("It calls the message handler when it's a correct message and ACKs it from the broker", async () => {
      const onMessage = jest.fn().mockReturnValue(ConsumeResult.ACK);
      const channel = mock<Channel>();

      const wrapped = wrapMessageHandler(channel, onMessage);

      // ToDo: Investigate
      //  PrettyFormatPluginError: tagName.includes is not a function
      //  TypeError: tagName.includes is not a function
      const msg = mock<ConsumeMessage>();
      await wrapped(msg);

      expect(onMessage).toBeCalledWith(msg);
      expect(channel.ack).toBeCalledWith(msg);
    });

    test("It does not call the original handler when the consumer is cancelled", async () => {
      const onMessage = jest.fn().mockReturnValue(ConsumeResult.ACK);
      const channel = mock<Channel>();

      const wrapped = wrapMessageHandler(channel, onMessage);

      await wrapped(null);

      expect(onMessage).not.toBeCalled();
      expect(channel.ack).not.toBeCalled();
    });

    test("It handles the situation when the message handler throws an error - still acks the message", async () => {
      const onMessage = jest
        .fn()
        .mockRejectedValue(new Error("Internal Error"));
      const channel = mock<Channel>();

      const wrapped = wrapMessageHandler(channel, onMessage);

      const msg = mock<ConsumeMessage>();
      await expect(wrapped(msg)).rejects.toThrow("Internal Error");

      expect(onMessage).toBeCalledWith(msg);
      // ToDo: Investigate
      //  PrettyFormatPluginError: tagName.includes is not a function
      //  TypeError: tagName.includes is not a function
      expect(channel.ack).toBeCalledWith(msg);
    });
  });

  describe("Publish function", () => {
    test("Publishes the message to the exchange passed in the context", async () => {
      const correctCtx = getCtx({
        queueName: "test-queue",
        exchangeName: "test-exchange",
      });

      correctCtx.channel.publish.mockReturnValue(true);

      const msg = "test-message";

      const result = await publish(correctCtx, msg);

      expect(correctCtx.channel.publish).toBeCalledWith(
        "test-exchange",
        "",
        expect.any(Buffer)
      );
      expect(result).toBe(correctCtx);
    });

    test("Publishes the message to the exchange passed in the context and awaits if publish returns false", async () => {
      const correctCtx = getCtx({
        queueName: "test-queue",
        exchangeName: "test-exchange",
      });

      correctCtx.channel.once.mockImplementation((_event, fn) => {
        fn();
        return correctCtx.channel;
      });

      correctCtx.channel.publish.mockReturnValue(false);

      const msg = "test-message";

      const result = await publish(correctCtx, msg);

      expect(correctCtx.channel.publish).toBeCalledWith(
        "test-exchange",
        "",
        expect.any(Buffer)
      );

      expect(result).toBe(correctCtx);
    });

    test("Throws Error when the exchange name is missing in the context", async () => {
      const brokenContext = getCtx({
        queueName: "test-queue",
        exchangeName: undefined,
      });

      const msg = "test-message";

      await expect(publish(brokenContext, msg)).rejects.toThrow(
        "Missing exchange name"
      );

      expect(brokenContext.channel.publish).not.toBeCalled();
    });
  });

  describe("Send to queue function", () => {
    test("It sends the message to the queue passed in the context", async () => {
      const ctx = getCtx({
        queueName: "test-queue-name",
      });
      const message = "test-message";

      ctx.channel.sendToQueue.mockReturnValue(true);

      const ret = await sendToQueue(ctx, message);

      expect(ctx.channel.sendToQueue).toBeCalledWith(
        "test-queue-name",
        expect.any(Buffer)
      );
      expect(ret).toBe(ctx);
    });

    test("It sends the message to the queue and respects awaits if sending returns false", async () => {
      const ctx = getCtx({
        queueName: "test-queue-name",
      });
      const message = "test-message";

      ctx.channel.once.mockImplementation((_event, fn) => {
        fn();
        return ctx.channel;
      });
      ctx.channel.sendToQueue.mockReturnValue(false);

      const ret = await sendToQueue(ctx, message);

      expect(ctx.channel.sendToQueue).toBeCalledWith(
        "test-queue-name",
        expect.any(Buffer)
      );
      expect(ret).toBe(ctx);
    });

    test("It throws Error when the queue name is not provided", async () => {
      const ctx = getCtx({
        queueName: undefined,
      });
      const message = "test-message";

      ctx.channel.sendToQueue.mockReturnValue(true);

      await expect(sendToQueue(ctx, message)).rejects.toThrow(
        "Missing queue name"
      );

      expect(ctx.channel.sendToQueue).not.toBeCalled();
    });
  });

  describe("Cancel consumer function", () => {
    test("It calls out cancel on the channel and returns the connection object for chaining", async () => {
      const ctx = {
        ...getCtx(),
        consumerTag: "example-consumer-tag",
      };
      const ret = await cancelConsumer(ctx);

      expect(ctx.channel.cancel).toBeCalledWith(ctx.consumerTag);
      expect(ret).toBe(ctx);
    });
  });

  describe("Default channel event listeners", () => {
    const mockLog = jest.fn();

    const listeners = createDefaultChannelEventListeners(mockLog);

    test("onClose logs the information", () => {
      listeners["close"]();
      expect(mockLog).toBeCalledWith("Channel#close()");
    });

    test("onClose logs the information if the server error was passed", () => {
      const err = new Error("Some server error");
      listeners["close"](err);
      expect(mockLog).toBeCalledWith("Channel#close()");
      expect(mockLog).toBeCalledWith(
        "Received Channel#close() with error",
        err
      );
    });

    test("onError logs the error", () => {
      const err = new Error("Example error");
      listeners["error"](err);
      expect(mockLog).toBeCalledWith("Channel#error()", err);
    });

    test("onReturn logs the information about returned message", () => {
      const msg = mock<ConsumeMessage>();
      listeners["return"](msg);
      expect(mockLog).toBeCalledWith("Channel#return()", msg);
    });

    test("onDrain logs the information about the event", () => {
      listeners["drain"]();
      expect(mockLog).toBeCalledWith("Channel#drain()");
    });

    test("onBlocked logs the information about the event", () => {
      listeners["blocked"]("reason");
      expect(mockLog).toBeCalledWith("Channel#blocked()", "reason");
    });

    test("onUnblocked logs the information about the event", () => {
      listeners["unblocked"]("reason");
      expect(mockLog).toBeCalledWith("Channel#unblocked()", "reason");
    });
  });
});
