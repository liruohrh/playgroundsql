// 由 scripts/gen.ts 通过环境变量 DB=<name> 调用，不要直接手改 dbCredentials，去改 db.config.ts
import { defineConfig } from "drizzle-kit";
import { config } from "./lib/config";
import { resolveTarget, schemaDir } from "./lib/dbs";

const name = process.env.DB;
if (!name) throw new Error("请通过 `pnpm gen <name>` 调用，或设置环境变量 DB=<name>");

const target = resolveTarget(name);
const common = {
  out: schemaDir(name),
  introspect: { casing: config.casing },
  verbose: true,
  strict: false,
};

export default target.kind === "sqlite"
  ? defineConfig({
      ...common,
      dialect: "sqlite",
      dbCredentials: { url: target.file },
    })
  : defineConfig({
      ...common,
      dialect: "mysql",
      dbCredentials: {
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: target.database,
      },
    });
