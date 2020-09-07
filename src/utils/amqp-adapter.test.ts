import {
  bindQueueAndExchange,
  closeChannel,
  connectToBroker,
  consume,
  createChannel,
  declareExchange,
  declareQueue,
  disconnectFromBroker,
  publish,
} from "./amqp-adapter";
import * as amqp from "amqplib";
import { Channel, Connection } from "amqplib";

import { mock } from "jest-mock-extended";

describe("AMQP FP Adapter", () => {
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
      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
      };

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

      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
      };

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

      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
      };

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

      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
      };

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

      const ctx = {
        channel: mock<Channel>(),
        connection: mock<Connection>(),
      };

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
      const correctCtx = {
        connection: mock<Connection>(),
        channel: mock<Channel>(),
        queueName: "test-queue",
        exchangeName: "test-exchange",
      };

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
        const correctCtx = {
          connection: mock<Connection>(),
          channel: mock<Channel>(),
          queueName: "test-queue",
          exchangeName: "test-exchange",
        };

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
    test("It returns a consumer context ", async () => {
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
      const consumerFn = consume(onMessage);

      const consContext = await consumerFn(ctx);

      expect(consContext.consumerTag).toEqual("test-consumer-tag");
    });
    test.todo(
      "It calls the 'onMessage' callback for the message which comes in - calls .ack on success"
    );
    test.todo(
      "It handles the consumer cancel scenario by calling the 'onCancel' callback"
    );
    test.todo(
      "Throws an error when the connection context does not contain a queue to consume"
    );
    test.todo(
      "It gracefully handles the situation, when the 'onCancel' throws"
    );
    test.todo(
      "It gracefully handles the situation, when the 'onMessage' throws"
    );
  });

  describe("Publish function", () => {
    test("Publishes the message to the exchange passed in the context", async () => {
      const correctCtx = {
        connection: mock<Connection>(),
        channel: mock<Channel>(),
        queueName: "test-queue",
        exchangeName: "test-exchange",
      };

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
      const correctCtx = {
        connection: mock<Connection>(),
        channel: mock<Channel>(),
        queueName: "test-queue",
        exchangeName: "test-exchange",
      };

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
      const brokenContext = {
        connection: mock<Connection>(),
        channel: mock<Channel>(),
        queueName: "test-queue",
        exchangeName: undefined,
      };

      const msg = "test-message";

      await expect(publish(brokenContext, msg)).rejects.toThrow(
        "Missing exchange name"
      );

      expect(brokenContext.channel.publish).not.toBeCalled();
    });
  });
});
