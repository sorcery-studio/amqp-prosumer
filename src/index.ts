#!/usr/bin/env node
/* eslint-disable node/shebang */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pkg from "../package.json";
import { createCommand } from "commander";
import { createApp } from "./app";
import { CommandFactoryFn, reportErrorAndExit } from "./commands/common";

createApp(pkg.version, createCommand as CommandFactoryFn)
  .parseAsync(process.argv)
  .catch(reportErrorAndExit);
