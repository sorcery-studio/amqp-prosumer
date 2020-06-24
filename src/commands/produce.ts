import {createCommand} from "commander";

export const produceCommand = createCommand("produce");

produceCommand.option("-e, --exchange", "The name of exchange to assert");
produceCommand.option("-q, --queue", "The name of the queue to assert");
produceCommand.option("-i, --inFile", "The file which contains the messages to produce messages (one per line)");

produceCommand.action(() => {
    console.log("I will now produce");
});
