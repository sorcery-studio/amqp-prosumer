import { writeMessageToFile } from "./output-writer";
import { ConsumeMessage } from "amqplib";
import fs from "fs";

jest.mock("fs");

describe("Output Writer", () => {
  test("writeMessageToFile writes file to system", () => {
    writeMessageToFile({
      content: Buffer.from("example-message"),
    } as ConsumeMessage);
    expect(fs.writeFileSync).toBeCalledWith(1, "example-message\n");
  });
});
