import {actionProduce, InputProvider} from "./produce";

const fnTestInput: InputProvider = async (onMessage) => {
    [
        "mesageA",
        "messageB"
    ].forEach((msg) => onMessage(msg));
}
describe("Produce Action", () =>{

    test("it's able to send a message to a queue", async () => {
        const result = await actionProduce(
            "amqp://localhost",
            undefined,
            "example-queue",
            fnTestInput
        );

        expect(result).toEqual(true);
    });

    test("it's able to send a message to an exchange", async () => {
        const result = await actionProduce(
            "amqp://localhost",
            "ExampleExchange",
            undefined,
            fnTestInput
        );

        expect(result).toEqual(true);
    });
});
