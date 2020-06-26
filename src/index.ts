#!/usr/bin/env node
// @ts-ignore
import * as pkg from "../package.json";
import {createCommand} from "commander";
import {createAndRun} from "./app";
import {ICommandFactory} from "./commands/common";

createAndRun(pkg.version, createCommand as ICommandFactory);
