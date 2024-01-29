import { STDOUT, writeMessageToFile } from "./output-writer";
import { ConsumeMessage } from "amqplib";
import fs from "fs";

jest.mock("fs");

describe("Output Writer", () => {
  test("writeMessageToFile writes file to system", async () => {
    await writeMessageToFile({
      content: Buffer.from("example-message"),
    } as ConsumeMessage);
    expect(fs.writeFileSync).toHaveBeenCalledWith(STDOUT, "example-message\n");
  });
});
