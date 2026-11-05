import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.js";
import Auth from "../src/pages/Auth";
import { authState } from "./support/auth";
import { installStorage } from "./support/storage";
const render = (path = "/auth") =>
  renderToStaticMarkup(
    createElement(StaticRouter, { location: path }, createElement(Auth)),
  );
beforeEach(() => {
  installStorage();
  authState.user = null;
});

test("login has explicit labels, autofill hints, and a demo entry point", () => {
  const html = render();
  assert.match(html, /for="email"/);
  assert.match(html, /autoComplete="email"/);
  assert.match(html, /autoComplete="current-password"/);
  assert.match(html, /Try demo/);
  assert.match(html, /Show password/);
});
test("forgot-password mode renders only its own submit action", () => {
  const html = render("/auth?view=forgot");
  assert.match(html, /Send reset link/);
  assert.doesNotMatch(html, /type="password"/);
  assert.equal((html.match(/type="submit"/g) || []).length, 1);
});
test("expired recovery links offer a fresh link instead of an unusable password form", () => {
  const html = render("/reset-password");
  assert.match(html, /request a new link/);
  assert.doesNotMatch(html, /Save new password/);
});
test("authenticated recovery has new-password autofill and confirmation fields", () => {
  authState.user = { id: "account" };
  const html = render("/reset-password");
  assert.equal((html.match(/autoComplete="new-password"/g) || []).length, 2);
  assert.match(html, /Save new password/);
  assert.doesNotMatch(html, /Try demo/);
});

test("a demo identity cannot open the account password-change form", () => {
  authState.user = { id: "demo-you" };
  authState.isDemo = true;
  const html = render("/reset-password");
  assert.doesNotMatch(html, /Save new password/);
  assert.match(html, /request a new link/);
  authState.isDemo = false;
});
