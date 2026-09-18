/**
 * 配置加载：有 db.config.local.ts 就用它，否则用 db.config.ts（模板默认值）。
 * db.config.local.ts 已被 .gitignore，放本机的路径 / 密码。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import type { config as templateConfig } from "../db.config";

export type DbConfig = typeof templateConfig;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localFile = path.join(root, "db.config.local.ts");
const require = createRequire(import.meta.url);

export const configFile = fs.existsSync(localFile) ? localFile : path.join(root, "db.config.ts");
export const config: DbConfig = require(configFile).config;
