# playground sql

用 drizzle 对本机的 sqlite / mysql 库做查询实验。

```
db.config.ts        # 配置模板：sources 数组（sqlite 目录/文件、mysql 节点）、输出目录
db.config.local.ts  # 优先于db.config.ts，避免影响git
lib/config.ts       # 配置类型 + 加载（local 优先）
drizzle.config.ts   # 由 gen 脚本通过 DB=<name> 驱动，不用手改
scripts/gen.ts      # pnpm gen
lib/dbs.ts          # 库名 -> sqlite 文件 / mysql 库 的解析
lib/open.ts         # openSqlite(name, schema) / openMysql(name, schema)
schemas/<name>/     # drizzle-kit pull 生成的 schema.ts + relations.ts（每次 gen 会整目录重建）
queries/<name>/     # 你的查询脚本（gen 只在目录不存在时创建并放一个 example.ts）
```

## 命令

```sh
pnpm gen --list            # 列出所有可用库名
pnpm gen example         # 重新生成 schemas/example/
pnpm gen example1 example2   # 可以一次多个
pnpm gen --all             # 全部
pnpm q queries/example/example.ts   # 运行一个查询脚本（tsx）
```

## 配置

`config.sources` 是数组，每项 `type` 为 `sqlite` 或 `mysql`，想加几个加几个：

```ts
sources: [
  { type: "sqlite", dirs: ["/data/sqlite"], files: ["/tmp/one.db"] },
  { type: "mysql", host: "127.0.0.1", user: "root", password: "root", databases: ["app"] },
  { type: "mysql", prefix: "prod_", host: "10.0.0.8", user: "ro", password: "…", databases: ["app"] }, // -> prod_app
]
```

库名规则：sqlite 文件去掉扩展名（`path/to/example.sqlite` → `example`），mysql 就是库名；不同来源同名时给 source 加 `prefix`。

## 写查询

```ts
import { eq, sql } from "drizzle-orm";
import * as schema from "../../schemas/example/schema";
import { openSqlite } from "../../lib/open";

const db = openSqlite("example", schema, { readonly: true });
console.log(await db.select().from(schema.users).where(eq(schema.users.id, 1)));
console.log(db.all(sql`select count(*) c from users`));
```

mysql 用 `openMysql("example", schema)`，裸 SQL 用 `await db.execute(sql\`...\`)`，结束时 `await db.$client.end()`。
