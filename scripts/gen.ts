/**
 * pnpm gen <name> [<name>...]   重新生成 schemas/<name>/（drizzle-kit pull）
 * pnpm gen --all                所有 sqlite 文件 + mysql 库
 * pnpm gen --list               只列出可用的数据库名
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { listTargets, queryDir, resolveTarget, schemaDir, type DbTarget } from "../lib/dbs";

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
  console.log("用法: pnpm gen <name> [<name>...] | pnpm gen --all | pnpm gen --list");
  process.exit(args.length === 0 ? 1 : 0);
}

if (args.includes("--list")) {
  for (const t of listTargets()) console.log(t.kind.padEnd(6), t.name, t.kind === "sqlite" ? t.file : "");
  process.exit(0);
}

const targets: DbTarget[] = args.includes("--all") ? listTargets() : args.map(resolveTarget);
const failed: string[] = [];

for (const t of targets) {
  const out = schemaDir(t.name);
  console.log(`\n==> ${t.kind} ${t.name}  ->  ${path.relative(process.cwd(), out)}/`);

  // pull 会基于 meta/ 里的快照生成增量迁移文件；这里只要 schema，所以每次全量重建
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const r = spawnSync("pnpm", ["exec", "drizzle-kit", "pull"], {
    stdio: "inherit",
    env: { ...process.env, DB: t.name },
  });
  if (r.status !== 0) {
    failed.push(t.name);
    continue;
  }

  // 只保留 schema.ts / relations.ts，去掉迁移 sql 和 meta 快照
  fs.rmSync(path.join(out, "meta"), { recursive: true, force: true });
  for (const f of fs.readdirSync(out)) if (f.endsWith(".sql")) fs.rmSync(path.join(out, f));

  // drizzle-kit 0.31 的 mysql 反查 bug：DEFAULT '' 会被生成成 .default(') ，修正为 .default('')
  const schemaFile = path.join(out, "schema.ts");
  if (fs.existsSync(schemaFile)) {
    const src = fs.readFileSync(schemaFile, "utf8");
    const fixed = src.replaceAll(".default(')", ".default('')");
    if (fixed !== src) fs.writeFileSync(schemaFile, fixed);
  }

  const q = queryDir(t.name);
  if (!fs.existsSync(q)) {
    fs.mkdirSync(q, { recursive: true });
    fs.writeFileSync(path.join(q, "example.ts"), exampleFor(t));
    console.log(`    created ${path.relative(process.cwd(), q)}/example.ts`);
  }
}

if (failed.length) {
  console.error(`\n失败: ${failed.join(", ")}`);
  process.exit(1);
}

function exampleFor(t: DbTarget): string {
  const open = t.kind === "sqlite" ? "openSqlite" : "openMysql";
  return `// 运行: pnpm q ${path.relative(process.cwd(), path.join(queryDir(t.name), "example.ts"))}
import { sql } from "drizzle-orm";
import * as schema from "../../schemas/${t.name}/schema";
import { ${open} } from "../../lib/open";

const db = ${open}("${t.name}", schema);

console.log("tables:", Object.keys(schema));

// 例: console.log(await db.select().from(schema.<table>).limit(5));
${t.kind === "sqlite"
  ? "console.log(db.all(sql`select 1 as ok`));"
  : "console.log((await db.execute(sql`select 1 as ok`))[0]);\n\nawait db.$client.end();"}
`;
}
