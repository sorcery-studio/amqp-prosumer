#!/usr/bin/env node
// @ts-ignore
import * as pkg from "../package.json";
import {createCommand} from "commander";
import {createAndRun} from "./app";
import {CommandFactoryFn} from "./commands/common";

createAndRun(pkg.version, createCommand as CommandFactoryFn);
