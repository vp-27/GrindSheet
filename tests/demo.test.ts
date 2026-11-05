import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { getLogs, getRows, saveRow, deleteRow } from "../src/lib/app-data";
import {
  createDemoData,
  DEMO_DATA_EVENT,
  DEMO_USER_ID,
  isDemoActive,
  readDemoData,
  setDemoActive,
} from "../src/lib/demo-store";
import { backendCalls } from "./support/supabase";
import { installStorage } from "./support/storage";

beforeEach(() => {
  installStorage();
  backendCalls.length = 0;
  setDemoActive(true);
});

test("sample workouts cover six weeks, reference valid exercises, and never occur in the future", () => {
  const now = new Date("2026-11-05T07:00:00Z");
  const data = createDemoData(now);
  assert.equal(data.profiles.length, 4);
  assert.equal(data.categories.length, 6);
  assert.ok(data.exercise_logs.length > 200);
  const exerciseIds = new Set(data.exercises.map((exercise) => exercise.id));
  for (const log of data.exercise_logs) {
    assert.ok(exerciseIds.has(log.exercise_id));
    assert.ok(new Date(log.timestamp) <= now);
  }
});

test("every demo data path stays local, including profile, catalog, and workout mutations", async () => {
  for (const table of [
    "categories",
    "exercises",
    "profiles",
    "exercise_logs",
  ] as const)
    assert.equal((await getRows(table)).error, null);
  const category = (await saveRow("categories", { name: "Demo custom" }))
    .data![0];
  const exercise = (
    await saveRow("exercises", { name: "Demo lift", category_id: category.id })
  ).data![0];
  const log = (
    await saveRow("exercise_logs", {
      user_id: DEMO_USER_ID,
      exercise_id: exercise.id,
      weight: 100,
    })
  ).data![0];
  await saveRow("exercise_logs", { weight: 110 }, log.id);
  await saveRow(
    "profiles",
    { id: DEMO_USER_ID, name: "Demo edit", username: "demo" },
    DEMO_USER_ID,
  );
  assert.equal(
    (await getLogs(DEMO_USER_ID)).data!.find((item) => item.id === log.id)
      ?.weight,
    110,
  );
  assert.ok(
    (await getLogs(DEMO_USER_ID, true)).data!.every(
      (item) => item.user_id !== DEMO_USER_ID,
    ),
  );
  await deleteRow("exercise_logs", log.id);
  await deleteRow("exercises", exercise.id);
  await deleteRow("categories", category.id);
  assert.deepEqual(backendCalls, []);
});

test("demo changes survive exit/reentry, and account requests use the backend after exiting", async () => {
  await saveRow(
    "profiles",
    { id: DEMO_USER_ID, name: "Saved locally", username: "local" },
    DEMO_USER_ID,
  );
  setDemoActive(false);
  assert.equal(isDemoActive(), false);
  await getLogs("real-account-id");
  assert.ok(
    backendCalls.some(
      (call) =>
        call.action === "eq" &&
        call.args[0] === "user_id" &&
        call.args[1] === "real-account-id",
    ),
  );
  assert.ok(!JSON.stringify(backendCalls).includes("Saved locally"));
  setDemoActive(true);
  assert.equal(readDemoData().profiles[0].name, "Saved locally");
});

test("deleting a local category removes only its exercises and their logs", async () => {
  const before = readDemoData();
  const category = (await saveRow("categories", { name: "Temporary" }))
    .data![0];
  const exercise = (
    await saveRow("exercises", {
      name: "Temporary lift",
      category_id: category.id,
    })
  ).data![0];
  await saveRow("exercise_logs", {
    user_id: DEMO_USER_ID,
    exercise_id: exercise.id,
    weight: 0,
  });
  await deleteRow("categories", category.id);
  assert.deepEqual(readDemoData(), before);
});

test("storage failures report errors and do not emit a successful change", async () => {
  const before = readDemoData();
  let changes = 0;
  window.addEventListener(DEMO_DATA_EVENT, () => changes++);
  localStorage.setItem = () => {
    throw new Error("Storage full");
  };
  const result = await saveRow("categories", { name: "Cannot persist" });
  assert.equal(result.error?.message, "Storage full");
  assert.equal(changes, 0);
  assert.deepEqual(readDemoData(), before);
  assert.deepEqual(backendCalls, []);
});

test("updating a missing item fails instead of resurrecting a deleted workout", async () => {
  const result = await saveRow("exercise_logs", { weight: 100 }, "missing-log");
  assert.ok(result.error);
  assert.deepEqual(backendCalls, []);
});
