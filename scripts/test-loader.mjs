import { registerHooks } from "node:module";
import { existsSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const mocks = new Map([
  [
    "@/integrations/supabase/client",
    new URL("tests/support/supabase.ts", root).href,
  ],
  ["@/context/AuthContext", new URL("tests/support/auth.ts", root).href],
]);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (mocks.has(specifier))
      return { url: mocks.get(specifier), shortCircuit: true };
    if (specifier.startsWith("@/"))
      specifier = new URL(`src/${specifier.slice(2)}`, root).href;
    if (
      (specifier.startsWith(".") || specifier.startsWith("file:")) &&
      context.parentURL
    ) {
      const url = new URL(specifier, context.parentURL);
      if (url.protocol === "file:") {
        for (const extension of [
          "",
          ".ts",
          ".tsx",
          "/index.ts",
          "/index.tsx",
        ]) {
          const path = fileURLToPath(url) + extension;
          if (existsSync(path) && statSync(path).isFile())
            return { url: pathToFileURL(path).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.endsWith(".css"))
      return { format: "module", source: "", shortCircuit: true };
    if (/\.tsx?$/.test(url)) {
      const source = ts.transpileModule(
        readFileSync(fileURLToPath(url), "utf8"),
        {
          fileName: fileURLToPath(url),
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
          },
        },
      ).outputText;
      return { format: "module", source, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
