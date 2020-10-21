import { ConsumeResult } from "../../utils/amqp-adapter";
import fs from "fs";
import { ConsumeMessage } from "amqplib";

export async function writeMessageToFile(
  msg: ConsumeMessage
): Promise<ConsumeResult> {
  const write = msg.content.toString("utf-8");
  fs.writeFileSync(1, write + "\n");
  return ConsumeResult.ACK;
}
