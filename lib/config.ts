/**
 * 配置加载：有 db.config.local.ts 就用它，否则用 db.config.ts（模板默认值）。
 * db.config.local.ts 已被 .gitignore，放本机的路径 / 密码。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

export interface SqliteSource {
  type: "sqlite";
  /** 递归扫描这些目录下的 sqlite 文件 */
  dirs?: string[];
  /** 单个文件路径 */
  files?: string[];
  /** 扫描 dirs 时识别为 sqlite 的扩展名，默认 [".sqlite", ".sqlite3", ".db"] */
  exts?: string[];
  /** 库名前缀，用来区分不同来源里的同名库；name = prefix + 文件名(去扩展名) */
  prefix?: string;
}

export interface MysqlSource {
  type: "mysql";
  host: string;
  port?: number;
  user: string;
  password: string;
  databases: string[];
  /** 库名前缀，用来区分不同节点上的同名库；name = prefix + database */
  prefix?: string;
}

export type DbSource = SqliteSource | MysqlSource;

export interface DbConfig {
  sources: DbSource[];
  /** drizzle-kit pull 生成代码的目录：<schemasDir>/<name>/schema.ts */
  schemasDir?: string;
  /** 写查询脚本的目录：<queriesDir>/<name>/，不存在时 gen 会自动创建 */
  queriesDir?: string;
  /** 生成 TS 字段名的风格 */
  casing?: "camel" | "preserve";
}

export const DEFAULT_SQLITE_EXTS = [".sqlite", ".sqlite3", ".db"];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localFile = path.join(root, "db.config.local.ts");
const require = createRequire(import.meta.url);

export const configFile = fs.existsSync(localFile) ? localFile : path.join(root, "db.config.ts");

const raw: DbConfig = require(configFile).config;
export const config = {
  schemasDir: "schemas",
  queriesDir: "queries",
  casing: "camel" as const,
  ...raw,
};
