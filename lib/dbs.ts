import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

export type SqliteTarget = { kind: "sqlite"; name: string; file: string };
export type MysqlTarget = { kind: "mysql"; name: string; database: string };
export type DbTarget = SqliteTarget | MysqlTarget;

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      walk(p, out);
    } else if (config.sqliteExts.includes(path.extname(ent.name))) {
      out.push(p);
    }
  }
  return out;
}

/** 列出所有可用的数据库（sqlite 文件 + mysql 库） */
export function listTargets(): DbTarget[] {
  const targets: DbTarget[] = [];
  const seen = new Map<string, string>();

  for (const dir of config.sqliteDirs) {
    for (const file of walk(dir)) {
      const name = path.basename(file, path.extname(file));
      const prev = seen.get(name);
      if (prev) throw new Error(`sqlite 库名重复 "${name}":\n  ${prev}\n  ${file}`);
      seen.set(name, file);
      targets.push({ kind: "sqlite", name, file });
    }
  }
  for (const database of config.mysql.databases) {
    if (seen.has(database)) throw new Error(`mysql 库名 "${database}" 与 sqlite 文件重名: ${seen.get(database)}`);
    seen.set(database, "mysql");
    targets.push({ kind: "mysql", name: database, database });
  }
  return targets;
}

export function resolveTarget(name: string): DbTarget {
  const targets = listTargets();
  const t = targets.find((t) => t.name === name);
  if (!t) {
    throw new Error(
      `未知数据库 "${name}"，可用的有:\n` + targets.map((t) => `  ${t.kind.padEnd(6)} ${t.name}`).join("\n"),
    );
  }
  return t;
}

export const schemaDir = (name: string) => path.resolve(config.schemasDir, name);
export const queryDir = (name: string) => path.resolve(config.queriesDir, name);
