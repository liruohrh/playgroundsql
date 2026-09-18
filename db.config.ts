/**
 * 配置模板。本机使用请复制为 db.config.local.ts（已 gitignore），存在时优先于本文件。
 *
 * sources 是一个数组，每项 type 为 sqlite 或 mysql，可以随意加多个：
 *  - sqlite：dirs 递归扫描目录、files 指定单个文件；库名 = prefix + 文件名去扩展名
 *            例如 data/example.sqlite  ->  example
 *  - mysql： 一个节点一项；库名 = prefix + database
 *  - 不同来源出现同名库时，用 prefix 区分（如 prefix: "dev_"）
 *
 * 用法：pnpm gen --list / pnpm gen <name> / pnpm gen --all
 */
import os from "node:os";
import path from "node:path";
import type { DbConfig } from "./lib/config";

const home = os.homedir();

export const config: DbConfig = {
  sources: [
    {
      type: "sqlite",
      dirs: [path.join(home, "path/to/sqlite-dir")],
      files: [path.join(home, "path/to/single.sqlite")],
      // exts: [".sqlite", ".sqlite3", ".db"],
    },
    {
      type: "mysql",
      host: "127.0.0.1",
      port: 3306,
      user: "root",
      password: "root",
      databases: ["example"],
    },
    // {
    //   type: "mysql",
    //   prefix: "prod_",
    //   host: "10.0.0.8",
    //   user: "readonly",
    //   password: "***",
    //   databases: ["example"],   // -> prod_example
    // },
  ],

  /** drizzle-kit pull 生成代码的目录：<schemasDir>/<name>/schema.ts */
  schemasDir: "schemas",
  /** 写查询脚本的目录：<queriesDir>/<name>/，不存在时 gen 会自动创建 */
  queriesDir: "queries",
  /** 生成 TS 字段名的风格：camel | preserve */
  casing: "camel",
};
