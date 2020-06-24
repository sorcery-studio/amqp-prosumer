#!/usr/bin/env node
// @ts-ignore
import * as pkg from "../package.json";
import {createAndRun} from "./app";

createAndRun(pkg.version);
