import {
  actionConsumeQueue,
  IConsumeFromQueueCommandOptions,
} from "./from-queue.action";
import * as amqplib from "amqplib";
import { Channel, Connection } from "amqplib";
import { mock } from "jest-mock-extended";

describe("Consume From Queue Action Unit Tests", () => {
  describe("The action itself", () => {
    test("Establishes the connection to the broker and sets up the channel without asserting the queue if not required and returns a 'stop' function", async () => {
      // Arrange
      // Command arguments
      const args = {
        assert: false,
        autoDelete: false,
        durable: false,
        exclusive: false,
        url: "amqp://some-host",
      } as IConsumeFromQueueCommandOptions;

      // The connection to the broker
      const mockConnection = mock<Connection>();
      const mockChannel = mock<Channel>();
      const connectSpy = jest.spyOn(amqplib, "connect");
      connectSpy.mockResolvedValueOnce(mockConnection);
      mockConnection.createChannel.mockResolvedValueOnce(mockChannel);
      mockChannel.consume.mockResolvedValueOnce({
        consumerTag: "someConsumerTag",
      });

      // Act
      const stopFunction = await actionConsumeQueue("testQueue", args);

      // Assert
      expect(stopFunction).toBeInstanceOf(Function);
      expect(connectSpy).toHaveBeenCalledWith(args.url);
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockConnection.createConfirmChannel).not.toHaveBeenCalled();
      expect(mockChannel.assertQueue).not.toHaveBeenCalled();
      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockChannel.cancel).not.toHaveBeenCalled();
      expect(mockConnection.close).not.toHaveBeenCalled();
    });

    test("Establishes the connection to the broker and sets up the channel without and the queue when requested", async () => {
      // Arrange
      // Command arguments
      const args = {
        assert: true,
        autoDelete: false,
        durable: false,
        exclusive: false,
        url: "amqp://some-host",
      } as IConsumeFromQueueCommandOptions;

      // The connection to the broker
      const mockConnection = mock<Connection>();
      const mockChannel = mock<Channel>();
      const connectSpy = jest.spyOn(amqplib, "connect");
      connectSpy.mockResolvedValueOnce(mockConnection);
      mockConnection.createChannel.mockResolvedValueOnce(mockChannel);
      mockChannel.consume.mockResolvedValueOnce({
        consumerTag: "someConsumerTag",
      });
      mockChannel.assertQueue.mockResolvedValueOnce({
        queue: "testQueue",
        messageCount: 0,
        consumerCount: 0,
      });

      // Act
      await actionConsumeQueue("testQueue", args);

      // Assert
      expect(connectSpy).toHaveBeenCalledWith(args.url);
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockConnection.createConfirmChannel).not.toHaveBeenCalled();
      expect(mockChannel.assertQueue).toHaveBeenCalledWith("testQueue", {
        autoDelete: false,
        durable: false,
        exclusive: false,
      });
      expect(mockChannel.close).not.toHaveBeenCalled();
      expect(mockChannel.cancel).not.toHaveBeenCalled();
      expect(mockConnection.close).not.toHaveBeenCalled();
    });

    test("Returns a function which can be used to stop the action", async () => {
      // Arrange
      // Command arguments
      const args = {
        assert: false,
        autoDelete: false,
        durable: false,
        exclusive: false,
        url: "amqp://some-host",
      } as IConsumeFromQueueCommandOptions;

      // The connection to the broker
      const mockConnection = mock<Connection>();
      const mockChannel = mock<Channel>();
      const connectSpy = jest.spyOn(amqplib, "connect");
      connectSpy.mockResolvedValueOnce(mockConnection);
      mockConnection.createChannel.mockResolvedValueOnce(mockChannel);
      mockChannel.consume.mockResolvedValueOnce({
        consumerTag: "someConsumerTag",
      });

      // Act
      const stopFunction = await actionConsumeQueue("testQueue", args);
      await stopFunction();

      // Assert
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockChannel.cancel).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    describe("Error handling", () => {
      const errSpy = jest.spyOn(console, "error");
      // Silence the console
      errSpy.mockImplementation(() => {
        return;
      });

      test("It logs an error when the connection fails", async () => {
        // Arrange
        const opts = {
          assert: false,
          autoDelete: false,
          durable: false,
          exclusive: false,
          url: "amqp://some-host",
        } as IConsumeFromQueueCommandOptions;

        const spyConnect = jest.spyOn(amqplib, "connect");
        const error = new Error("Error during connection");
        spyConnect.mockRejectedValueOnce(error);

        // Act
        await expect(actionConsumeQueue("testQueue", opts)).rejects.toThrow(
          error,
        );

        // Assert
        expect(errSpy).toHaveBeenCalledWith(
          "The consume action encountered an error",
          error,
        );
      });

      test("It logs an error when the channel creation fails", async () => {
        // Arrange
        const opts = {
          assert: false,
          autoDelete: false,
          durable: false,
          exclusive: false,
          url: "amqp://some-host",
        } as IConsumeFromQueueCommandOptions;

        const mockConnection = mock<Connection>();
        jest.spyOn(amqplib, "connect").mockResolvedValueOnce(mockConnection);

        const error = new Error("Error during channel creation");
        mockConnection.createChannel.mockRejectedValueOnce(error);

        // Act
        await expect(actionConsumeQueue("testQueue", opts)).rejects.toThrow(
          error,
        );

        // Assert
        expect(errSpy).toHaveBeenCalledWith(
          "The consume action encountered an error",
          error,
        );
      });

      test("It logs an error when the queue assertion fails fails", async () => {
        // Arrange
        const opts = {
          assert: true,
          autoDelete: false,
          durable: false,
          exclusive: false,
          url: "amqp://some-host",
        } as IConsumeFromQueueCommandOptions;

        const mockConnection = mock<Connection>();
        const mockChannel = mock<Channel>();
        jest.spyOn(amqplib, "connect").mockResolvedValueOnce(mockConnection);
        mockConnection.createChannel.mockResolvedValueOnce(mockChannel);
        const error = new Error("Error during queue assertion");
        mockChannel.assertQueue.mockRejectedValueOnce(error);

        // Act
        await expect(actionConsumeQueue("testQueue", opts)).rejects.toThrow(
          error,
        );

        // Assert
        expect(errSpy).toHaveBeenCalledWith(
          "The consume action encountered an error",
          error,
        );
      });

      test("It logs an error when the consumer cancel fails", async () => {
        // Arrange
        const opts = {
          assert: true,
          autoDelete: false,
          durable: false,
          exclusive: false,
          url: "amqp://some-host",
        } as IConsumeFromQueueCommandOptions;

        const mockConnection = mock<Connection>();
        const mockChannel = mock<Channel>();
        jest.spyOn(amqplib, "connect").mockResolvedValueOnce(mockConnection);
        mockConnection.createChannel.mockResolvedValueOnce(mockChannel);

        mockChannel.assertQueue.mockResolvedValueOnce({
          queue: "testQueue",
          messageCount: 0,
          consumerCount: 0,
        });
        mockChannel.consume.mockResolvedValueOnce({
          consumerTag: "test-consumer-tag",
        });

        const error = new Error("Error during consumer cancel");
        mockChannel.cancel.mockRejectedValueOnce(error);

        const stop = await actionConsumeQueue("testQueue", opts);

        // Act
        await stop();

        // Assert
        expect(errSpy).toHaveBeenCalledWith("Error during shutdown", error);
      });

      test("It logs an error when the channel close fails", async () => {
        // Arrange
        const opts = {
          assert: true,
          autoDelete: false,
          durable: false,
          exclusive: false,
          url: "amqp://some-host",
        } as IConsumeFromQueueCommandOptions;

        const mockConnection = mock<Connection>();
        const mockChannel = mock<Channel>();
        jest.spyOn(amqplib, "connect").mockResolvedValueOnce(mockConnection);
        mockConnection.createChannel.mockResolvedValueOnce(mockChannel);

        mockChannel.assertQueue.mockResolvedValueOnce({
          queue: "testQueue",
          messageCount: 0,
          consumerCount: 0,
        });
        mockChannel.consume.mockResolvedValueOnce({
          consumerTag: "test-consumer-tag",
        });

        const error = new Error("Error during channel close");
        mockChannel.close.mockRejectedValueOnce(error);

        const stop = await actionConsumeQueue("testQueue", opts);

        // Act
        await stop();

        // Assert
        expect(errSpy).toHaveBeenCalledWith("Error during shutdown", error);
      });

      test("It logs an error when the connection close fails", async () => {
        // Arrange
        const opts = {
          assert: true,
          autoDelete: false,
          durable: false,
          exclusive: false,
          url: "amqp://some-host",
        } as IConsumeFromQueueCommandOptions;

        const mockConnection = mock<Connection>();
        const mockChannel = mock<Channel>();
        jest.spyOn(amqplib, "connect").mockResolvedValueOnce(mockConnection);
        mockConnection.createChannel.mockResolvedValueOnce(mockChannel);

        mockChannel.assertQueue.mockResolvedValueOnce({
          queue: "testQueue",
          messageCount: 0,
          consumerCount: 0,
        });
        mockChannel.consume.mockResolvedValueOnce({
          consumerTag: "test-consumer-tag",
        });

        const error = new Error("Error during connection close");
        mockConnection.close.mockRejectedValueOnce(error);

        const stop = await actionConsumeQueue("testQueue", opts);

        // Act
        await stop();

        // Assert
        expect(errSpy).toHaveBeenCalledWith("Error during shutdown", error);
      });
    });
  });
});
