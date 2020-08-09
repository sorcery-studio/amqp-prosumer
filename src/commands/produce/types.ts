import { OnMessageFn } from "../../utils/io";

export type InputProviderFn = (onMessage: OnMessageFn) => void;
