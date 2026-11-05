import type { Database } from "@/integrations/supabase/types";

type Row<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export const DEMO_USER_ID = "demo-you";
export const DEMO_DATA_EVENT = "grindsheet:demo-data";
const MODE_KEY = "grindsheet:demo-mode";
const DATA_KEY = "grindsheet:demo:v1";

export interface DemoData {
  version: 1;
  profiles: Row<"profiles">[];
  categories: Row<"categories">[];
  exercises: Row<"exercises">[];
  exercise_logs: Row<"exercise_logs">[];
}

let demoMode: boolean | undefined;
export const isDemoActive = () => {
  if (demoMode !== undefined) return demoMode;
  try {
    demoMode = sessionStorage.getItem(MODE_KEY) === "true";
  } catch {
    demoMode = false;
  }
  return demoMode;
};
export const setDemoActive = (active: boolean) => {
  if (active) sessionStorage.setItem(MODE_KEY, "true");
  else {
    try {
      sessionStorage.removeItem(MODE_KEY);
    } catch {
      /* Exit remains possible if storage becomes unavailable. */
    }
  }
  demoMode = active;
};

export function createDemoData(now = new Date()): DemoData {
  const created_at = now.toISOString();
  const profiles = [
    "Alex Morgan",
    "Sam Rivera",
    "Jordan Lee",
    "Taylor Brooks",
  ].map((name, i) => ({
    id: i === 0 ? DEMO_USER_ID : `demo-friend-${i}`,
    name,
    username: i === 0 ? "alex" : name.toLowerCase().replace(" ", "_"),
    avatar_url: null,
    created_at,
  }));
  const categories = ["Chest", "Back", "Legs", "Shoulders", "Arms", "Core"].map(
    (name, i) => ({
      id: `demo-category-${i}`,
      name,
      description: `${name} exercises`,
      user_id: null,
      created_at,
    }),
  );
  const exerciseDefinitions = [
    ["Bench Press", 0, 115],
    ["Incline Dumbbell Press", 0, 35],
    ["Barbell Row", 1, 95],
    ["Lat Pulldown", 1, 85],
    ["Squat", 2, 145],
    ["Romanian Deadlift", 2, 135],
    ["Shoulder Press", 3, 35],
    ["Dumbbell Curl", 4, 20],
    ["Cable Crunch", 5, 40],
  ] as const;
  const exercises = exerciseDefinitions.map(([name, categoryIndex], i) => ({
    id: `demo-exercise-${i}`,
    name,
    category_id: categories[categoryIndex].id,
    description: "",
    user_id: null,
    created_at,
  }));
  const exercise_logs: DemoData["exercise_logs"] = [];
  for (let day = 42; day >= 0; day -= 2) {
    profiles.forEach((profile, userIndex) => {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      date.setHours(9 + userIndex, 0, 0, 0);
      if (date > now) date.setTime(now.getTime() - userIndex * 60000);
      exerciseDefinitions.forEach(([, , baseline], exerciseIndex) => {
        if ((exerciseIndex + day / 2) % 3 !== 0) return;
        exercise_logs.push({
          id: `demo-log-${userIndex}-${day}-${exerciseIndex}`,
          user_id: profile.id,
          exercise_id: exercises[exerciseIndex].id,
          weight: baseline + Math.floor((42 - day) / 7) * 5 + userIndex * 5,
          timestamp: date.toISOString(),
          note: day === 0 ? "Feeling stronger. Keep the form steady." : null,
        });
      });
    });
  }
  return { version: 1, profiles, categories, exercises, exercise_logs };
}

export function readDemoData(): DemoData {
  try {
    const stored = JSON.parse(localStorage.getItem(DATA_KEY) || "null");
    if (
      stored?.version === 1 &&
      ["profiles", "categories", "exercises", "exercise_logs"].every((key) =>
        Array.isArray(stored[key]),
      )
    ) {
      return stored;
    }
  } catch {
    /* Recover an outdated or malformed demo without touching account data. */
  }
  const data = createDemoData();
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  return data;
}

export function writeDemoData(data: DemoData) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(DEMO_DATA_EVENT));
}
