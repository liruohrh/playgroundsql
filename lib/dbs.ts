import fs from "node:fs";
import path from "node:path";
import { config, DEFAULT_SQLITE_EXTS, type MysqlSource } from "./config";

export type SqliteTarget = { kind: "sqlite"; name: string; file: string };
export type MysqlTarget = { kind: "mysql"; name: string; database: string; source: MysqlSource };
export type DbTarget = SqliteTarget | MysqlTarget;

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name.startsWith(".")) continue;
      walk(p, exts, out);
    } else if (exts.includes(path.extname(ent.name))) {
      out.push(p);
    }
  }
  return out;
}

/** 列出所有可用的数据库（sqlite 文件 + mysql 库） */
export function listTargets(): DbTarget[] {
  const targets: DbTarget[] = [];
  const seen = new Map<string, string>();
  const add = (t: DbTarget, where: string) => {
    const prev = seen.get(t.name);
    if (prev) throw new Error(`库名重复 "${t.name}":\n  ${prev}\n  ${where}\n给其中一个 source 加 prefix 区分`);
    seen.set(t.name, where);
    targets.push(t);
  };

  for (const src of config.sources) {
    const prefix = src.prefix ?? "";
    if (src.type === "sqlite") {
      const files = [
        ...(src.dirs ?? []).flatMap((d) => walk(d, src.exts ?? DEFAULT_SQLITE_EXTS)),
        ...(src.files ?? []),
      ];
      for (const file of files) {
        const name = prefix + path.basename(file, path.extname(file));
        add({ kind: "sqlite", name, file }, file);
      }
    } else {
      for (const database of src.databases) {
        const name = prefix + database;
        add({ kind: "mysql", name, database, source: src }, `mysql ${src.user}@${src.host}:${src.port ?? 3306}/${database}`);
      }
    }
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

export const describeTarget = (t: DbTarget) =>
  t.kind === "sqlite" ? t.file : `${t.source.user}@${t.source.host}:${t.source.port ?? 3306}/${t.database}`;

export const schemaDir = (name: string) => path.resolve(config.schemasDir, name);
export const queryDir = (name: string) => path.resolve(config.queriesDir, name);
