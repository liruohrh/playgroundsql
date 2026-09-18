/**
 * 在 queries/<name>/*.ts 里打开数据库：
 *
 *   import * as schema from "../../schemas/discourse/schema";
 *   import { openSqlite } from "../../lib/open";
 *   const db = openSqlite("discourse", schema);
 *   console.log(await db.select().from(schema.sites).limit(5));
 *
 * mysql 用 openMysql("social_media", schema)，用完记得 db.$client.end()。
 */
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleMysql } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { config } from "./config";
import { resolveTarget } from "./dbs";

export function openSqlite<S extends Record<string, unknown>>(name: string, schema: S, opts?: { readonly?: boolean }) {
  const t = resolveTarget(name);
  if (t.kind !== "sqlite") throw new Error(`"${name}" 不是 sqlite 库`);
  const client = new Database(t.file, { readonly: opts?.readonly ?? false });
  return drizzleSqlite(client, { schema });
}

export function openMysql<S extends Record<string, unknown>>(name: string, schema: S) {
  const t = resolveTarget(name);
  if (t.kind !== "mysql") throw new Error(`"${name}" 不是 mysql 库`);
  const client = mysql.createPool({
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: t.database,
  });
  return drizzleMysql(client, { schema, mode: "default" });
}
