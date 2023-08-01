#!/usr/bin/env node
/* eslint-disable node/shebang */
import { createCommand } from "commander";
import { createApp } from "./app";
import { CommandFactoryFn, reportErrorAndExit } from "./commands/common";
import fs from "fs";

type PackageInfo = { version: string };

const pkg = JSON.parse(
  fs.readFileSync(fs.realpathSync(__dirname + "/../package.json")).toString()
) as PackageInfo;

createApp(pkg.version, createCommand as CommandFactoryFn)
  .parseAsync(process.argv)
  .catch(reportErrorAndExit);
