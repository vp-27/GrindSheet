import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ChartWithLoader from "../src/components/dashboard/ChartWithLoader";

test("empty progress displays an empty state without a lingering animated skeleton", () => {
  const html = renderToStaticMarkup(
    createElement(ChartWithLoader, { data: [], loading: false }),
  );
  assert.match(html, /Your progress starts with a workout/);
  assert.doesNotMatch(html, /chart-skeleton/);
});
test("loading progress shows a labelled skeleton", () => {
  const html = renderToStaticMarkup(
    createElement(ChartWithLoader, { data: [], loading: true }),
  );
  assert.match(html, /aria-label="Loading progress"/);
  assert.match(html, /chart-skeleton/);
  assert.doesNotMatch(html, /Your progress starts with a workout/);
});
test("installation manifest uses a stable root and correctly sized PNG assets", () => {
  const root = new URL("../", import.meta.url);
  const manifest = JSON.parse(
    readFileSync(new URL("public/manifest.json", root), "utf8"),
  );
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(
      (icon) => icon.sizes === `${size}x${size}`,
    );
    assert.ok(icon);
    const png = readFileSync(new URL(`public${icon.src}`, root));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
  const html = readFileSync(new URL("index.html", root), "utf8");
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /apple-touch-icon.png/);
});
