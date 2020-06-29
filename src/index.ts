#!/usr/bin/env node
/* eslint-disable node/shebang */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as pkg from "../package.json";
import { createCommand } from "commander";
import { createAndRun } from "./app";
import { CommandFactoryFn } from "./commands/common";

createAndRun(pkg.version, createCommand as CommandFactoryFn);
