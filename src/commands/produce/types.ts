import { OnMessageFn } from "../../utils/io";
import { Debugger } from "debug";

export type InputProvider = (
  onMessage: OnMessageFn,
  logger: Debugger
) => Promise<void>;
