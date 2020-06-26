import {createCommand, program, Command} from "commander"
import {createAndRun} from "./app";
import {ICommandFactory} from "./commands/common";

const spyVersion = jest.spyOn(program, "version");
const spyCommand = jest.spyOn(program, "addCommand");
const spyParseAsync = jest.spyOn(program, "parseAsync").mockImplementation(async () => { return {} as Command });

beforeEach(() => {
    jest.resetAllMocks();
    createAndRun(APP_VERSION, createCommand as ICommandFactory);
});

const APP_VERSION = "1.0.0";

describe("AMQP ProSumer", () => {

    test("it sets the 'version' information for the command", () => {
        expect(spyVersion).toBeCalledWith(APP_VERSION);
    });

    test("it defines the 'consume' command", () => {
        expect(spyCommand).toBeCalledWith("consume", "Runs a AMQP consumer process");
    });

    test("it defines the 'produce' command", () => {
        expect(spyCommand).toBeCalledWith("produce", "Runs a AMQP producer process");
    });

    test("it parses the command line arguments", () => {
        expect(spyParseAsync).toBeCalled();
    });
});
