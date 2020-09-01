import { EventEmitter } from "events";

export const queue = {
  queue: "test-queue",
};

export const exchange = {
  exchange: "test-exchange",
};

const chEmitter = new EventEmitter();

export const channel = {
  on: jest.fn((event, callback) => {
    chEmitter.on(event, callback);
  }),
  once: jest.fn((event, callback) => {
    chEmitter.once(event, callback);
  }),
  emit: jest.fn((event) => {
    chEmitter.emit(event);
  }),
  assertExchange: jest.fn(() => exchange),
  assertQueue: jest.fn(() => queue),
  publish: jest.fn(() => true),
  sendToQueue: jest.fn(() => true),
  close: jest.fn(),
  bindQueue: jest.fn(),
  consume: jest.fn(() => {
    return {
      consumerTag: "test-consumer-tag",
    };
  }),
  cancel: jest.fn(),
};

export const connection = {
  createChannel: jest.fn(() => channel),
  close: jest.fn(),
};

export const connect = jest.fn(async () => connection);
