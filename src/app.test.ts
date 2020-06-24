import { program } from "commander"
import { createAndRun } from "./app";

jest.mock("commander");

beforeEach(() => {
    jest.resetAllMocks();
    createAndRun(APP_VERSION);
});

const APP_VERSION = "1.0.0";

describe("AMQP ProSumer", () => {

    test("it sets the 'version' information for the command", () => {
        expect(program.version).toBeCalledWith(APP_VERSION);
    });

    test("it defines the 'consume' command", () => {
        expect(program.command).toBeCalledWith("consume", "Runs a AMQP consumer process");
    });

    test("it defines the 'produce' command", () => {
        expect(program.command).toBeCalledWith("produce", "Runs a AMQP producer process");
    });

    test("it parses the command line arguments", () => {
        expect(program.parse).toBeCalled();
    });
});
