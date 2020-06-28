import {actionProduce, InputProvider, ProduceOptions} from "./produce";

const fnTestInput: InputProvider = async (onMessage) => {
    [
        "mesageA",
        "messageB"
    ].forEach((msg) => onMessage(msg));
}
describe("Produce Action", () =>{

    test("it's able to send a message to a queue", async () => {
        const target: ProduceOptions = {
            host: {
                url: "amqp://localhost"
            },
            queue: {
                name: "example-queue"
            }
        };

        const result = await actionProduce(
            target,
            fnTestInput
        );

        expect(result).toEqual(true);
    });

    test("it's able to send a message to an exchange", async () => {
        const target: ProduceOptions = {
            host: {
                url: "amqp://localhost"
            },
            exchange: {
                name: "ExampleExchange"
            }
        };

        const result = await actionProduce(
            target,
            fnTestInput
        );

        expect(result).toEqual(true);
    });
});
