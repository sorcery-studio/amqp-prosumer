export const queue = {
  queue: "",
};

export const exchange = {
  exchange: "",
};

export const channel = {
  on: jest.fn(),
  once: jest.fn(),
  assertExchange: jest.fn(() => exchange),
  assertQueue: jest.fn(() => queue),
  publish: jest.fn(() => true),
  sendToQueue: jest.fn(() => true),
  close: jest.fn(),
};

export const connection = {
  createChannel: jest.fn(() => channel),
  close: jest.fn(),
};

export const connect = jest.fn(() => connection);
