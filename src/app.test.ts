import {createCommand} from "commander";
import {createAndRun} from "./app";
import {CommandFactoryFn} from "./commands/common";

jest.mock("commander");

const mockCommand = {
    version: jest.fn(),
    command: jest.fn(),
    parseAsync: jest.fn(() => new Promise((resolve) => { resolve() })),
    option: jest.fn(),
    action: jest.fn(),
    addCommand: jest.fn()
};

(<jest.Mock>createCommand).mockImplementation(() => {
    return mockCommand;
});

beforeEach(() => {
    jest.clearAllMocks();
    createAndRun(APP_VERSION, createCommand as CommandFactoryFn);
});

const APP_VERSION = "1.0.0";

describe("AMQP ProSumer", () => {

    test("it creates the command", () => {
        expect(createCommand).toBeCalledWith();
    })

    test("it sets the 'version' information for the command", () => {
        expect(mockCommand.version).toBeCalledWith(APP_VERSION);
    });

    test("it defines the 'consume' and 'produce' commands", () => {
        // ToDo: Be more specific
        expect(mockCommand.addCommand).toBeCalledTimes(2);
    });

    test("it parses the command line arguments", () => {
        expect(mockCommand.parseAsync).toBeCalledTimes(1);
    });
});
