import { ConsumeResult } from "../../utils/amqp-adapter";
import fs from "fs";
import { ConsumeMessage } from "amqplib";

export const STDOUT = 1;

export function writeMessageToFile(
  msg: ConsumeMessage
): Promise<ConsumeResult> {
  const write = msg.content.toString("utf-8");
  fs.writeFileSync(STDOUT, write + "\n");
  return Promise.resolve(ConsumeResult.ACK);
}
