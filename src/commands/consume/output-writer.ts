import fs from "fs";
import { ConsumeMessage } from "amqplib";

export const STDOUT = 1;

export function writeMessageToFile(msg: ConsumeMessage): Promise<void> {
  const write = msg.content.toString("utf-8");
  fs.writeFileSync(STDOUT, write + "\n");
  return Promise.resolve();
}
