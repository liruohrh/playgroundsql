/**
 * 唯一的配置文件：所有路径 / 连接信息都在这里改。
 *
 * 数据库名（<name>）的规则：
 *  - sqlite：在 sqliteDirs 下递归扫描 *.sqlite，文件名去掉扩展名即 <name>
 *            例如 data/example.sqlite  ->  example
 *  - mysql：mysql.databases 里列出的库名即 <name>
 *
 * 用法：pnpm gen <name>   /   pnpm gen --all
 */
import os from "node:os";
import path from "node:path";

const home = os.homedir();

export const config = {
  /** 递归扫描这些目录下的 *.sqlite 文件 */
  sqliteDirs: [path.join(home, "path/to/.sqlite")],
  /** 识别为 sqlite 库的扩展名 */
  sqliteExts: [".sqlite", ".sqlite3", ".db"],

  mysql: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "root",
    databases: ["example2"],
  },

  /** drizzle-kit pull 生成代码的目录：<schemasDir>/<name>/schema.ts */
  schemasDir: "schemas",
  /** 写查询脚本的目录：<queriesDir>/<name>/，不存在时 gen 会自动创建 */
  queriesDir: "queries",

  /** 生成 TS 字段名的风格：camel | preserve */
  casing: "camel" as "camel" | "preserve",
};
