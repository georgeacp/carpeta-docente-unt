import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../../../", import.meta.url));

function diagnosticsFor(source) {
  const directory = mkdtempSync(join(tmpdir(), "anti-slop-symbols-"));

  try {
    const filename = join(directory, "fixture.tsx");
    const config = join(directory, ".oxlintrc.json");
    writeFileSync(filename, source);
    writeFileSync(
      config,
      JSON.stringify({
        jsPlugins: [
          { name: "anti-slop", specifier: join(root, "tools/oxlint/anti-slop/index.ts") },
        ],
        rules: { "anti-slop/no-shape-in-symbol-names": "error" },
      }),
    );
    const result = spawnSync(
      process.execPath,
      [
        join(root, "node_modules/oxlint/bin/oxlint"),
        "--config",
        config,
        "--format",
        "json",
        filename,
      ],
      { encoding: "utf8" },
    );
    assert.ifError(result.error);
    assert.ok(result.status === 0 || result.status === 1, result.stderr);

    return JSON.parse(result.stdout).diagnostics.filter(
      (diagnostic) => diagnostic.code === "anti-slop(no-shape-in-symbol-names)",
    );
  } finally {
    assert.equal(dirname(directory), tmpdir());
    rmSync(directory, { recursive: true, force: true });
  }
}

test("external import names and JSX prop names retain the library's contract", () => {
  const diagnostics = diagnosticsFor(`
    import type { PieSectorShapeProps as PieSectorProps } from "recharts";
    export function Sector(props: PieSectorProps) {
      return <Pie shape={props.render} />;
    }
  `);
  assert.equal(diagnostics.length, 0);
});

test("locally owned names remain rejected, including import aliases and JSX elements", () => {
  const diagnostics = diagnosticsFor(`
    import { Sector as LocalShape } from "recharts";
    export const shape = 1;
    export const example = <LocalShape />;
  `);
  assert.ok(diagnostics.some((diagnostic) => diagnostic.message.includes('"shape"')));
  assert.ok(diagnostics.some((diagnostic) => diagnostic.message.includes('"LocalShape"')));
});

test("an unaliased import still declares a local name subject to the naming rule", () => {
  assert.ok(diagnosticsFor('import { PieSectorShapeProps } from "recharts";').length > 0);
});

test("transaction statuses keep their colors and unfamiliar statuses use the fallback", async () => {
  const require = createRequire(join(root, "frontend/package.json"));
  const ts = require("typescript");
  const source = readFileSync(
    join(
      root,
      "frontend/src/app/(with-layouts)/(dashboard)/(home)/_component/last-transactions-table/data.ts",
    ),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  });
  const { getStatusColor } = await import(
    `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
  );
  assert.equal(getStatusColor("shipped"), "violet");
  assert.equal(getStatusColor("delivered"), "success");
  assert.equal(getStatusColor("pending"), "warning");
  assert.equal(getStatusColor("unfamiliar"), "gray");
  assert.equal(getStatusColor("__proto__"), "gray");
});

test("the application keeps every anti-slop rule enabled at error severity", () => {
  const config = JSON.parse(readFileSync(join(root, ".oxlintrc.json"), "utf8"));
  const upstream = readFileSync(join(root, "tools/oxlint/anti-slop/index.ts"), "utf8");
  const ruleNames = [...upstream.matchAll(/"([a-z-]+)":/g)].map((match) => match[1]);
  assert.equal(ruleNames.length, 18);
  for (const rule of ruleNames) {
    assert.equal(config.rules[`anti-slop/${rule}`], "error", rule);
  }
});
