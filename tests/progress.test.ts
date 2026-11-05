import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateProgress,
  getOverallProgressChartData,
} from "../src/utils/progressUtils";
import type { ExerciseLog } from "../src/types";
const exercise = {
  id: "exercise",
  categoryId: "category",
  name: "Weighted pull-up",
};
const logs = (weights: number[]): ExerciseLog[] =>
  weights.map((weight, i) => ({
    id: `log-${i}`,
    userId: "user",
    exerciseId: exercise.id,
    weight,
    timestamp: `2026-11-0${i + 1}T12:00:00Z`,
  }));

test("returning from weighted exercise to bodyweight records a 100% decrease", () => {
  const result = calculateProgress(logs([20, 0]), exercise.id, exercise);
  assert.equal(result.percentGainFromPrevious, -100);
  assert.equal(result.percentGainFromStart, -100);
});
test("overall progress retains a zero-pound starting weight", () => {
  const data = getOverallProgressChartData(
    logs([0, 10]),
    [exercise],
    [{ id: "category", name: "Back" }],
  );
  assert.equal(data.at(-1)?.Back, 100);
});
test("empty account has no fabricated personal record", () => {
  assert.deepEqual(calculateProgress([], exercise.id, exercise), {
    exercise,
    currentWeight: 0,
  });
});

test("sample data produces valid competition standings and PRs", async () => {
  const { createDemoData, DEMO_USER_ID } = await import(
    "../src/lib/demo-store"
  );
  const { generateCurrentTournament } = await import(
    "../src/utils/tournamentUtils"
  );
  const { getLeaderboard } = await import("../src/utils/progressUtils");
  const { LeaderboardType } = await import("../src/types");
  const data = createDemoData();
  const users = data.profiles.map((row) => ({
    id: row.id,
    name: row.name,
    username: row.username,
  }));
  const exercises = data.exercises.map((row) => ({
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
  }));
  const logs = data.exercise_logs.map((row) => ({
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    weight: row.weight,
    timestamp: row.timestamp,
  }));
  const tournament = generateCurrentTournament(
    users,
    logs,
    exercises,
    data.categories,
  );
  assert.equal(tournament.participants.length, 4);
  assert.ok(
    tournament.participants.some((person) => person.userId === DEMO_USER_ID),
  );
  assert.ok(
    tournament.participants.every(
      (person) =>
        Number.isFinite(person.totalPoints) && person.totalPoints >= 0,
    ),
  );
  const prs = getLeaderboard(
    logs,
    users,
    LeaderboardType.EXERCISE_PR,
    undefined,
    undefined,
    exercises,
  );
  assert.ok(prs.length >= exercises.length);
  assert.ok(prs.every((entry) => Number.isFinite(entry.value) && entry.user));
});

test("missing chart metrics stay missing while bodyweight zero stays zero", async () => {
  const { metricNumber } = await import("../src/lib/chart-utils");
  assert.ok(Number.isNaN(metricNumber(null)));
  assert.ok(Number.isNaN(metricNumber(undefined)));
  assert.equal(metricNumber(0), 0);
});
