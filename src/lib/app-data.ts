import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { isDemoActive, readDemoData, writeDemoData } from "./demo-store";

type Table = keyof Database["public"]["Tables"];
export type Row<T extends Table> = Database["public"]["Tables"][T]["Row"];
type Insert<T extends Table> = Database["public"]["Tables"][T]["Insert"];
type Result<T> = { data: T | null; error: { message: string } | null };

async function localResult<T>(action: () => T): Promise<Result<T>> {
  try {
    return { data: action(), error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        message:
          error instanceof Error
            ? error.message
            : "Could not save demo data on this device.",
      },
    };
  }
}

// Every data path makes the demo/account choice here, including settings mutations.
export async function getRows<T extends Table>(
  table: T,
): Promise<Result<Row<T>[]>> {
  if (isDemoActive())
    return localResult(() => {
      const rows = readDemoData()[table] as Row<T>[];
      return table === "categories" || table === "exercises"
        ? [...rows].sort((a, b) =>
            ("name" in a ? String(a.name) : "").localeCompare(
              "name" in b ? String(b.name) : "",
            ),
          )
        : rows;
    });
  const query = supabase.from(table).select("*");
  return (await (table === "categories" || table === "exercises"
    ? query.order("name")
    : query)) as Result<Row<T>[]>;
}

export async function getLogs(
  userId?: string,
  excludeUser = false,
): Promise<Result<Row<"exercise_logs">[]>> {
  if (isDemoActive())
    return localResult(() =>
      readDemoData()
        .exercise_logs.filter(
          (log) =>
            !userId ||
            (excludeUser ? log.user_id !== userId : log.user_id === userId),
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    );
  let query = supabase
    .from("exercise_logs")
    .select("*")
    .order("timestamp", { ascending: false });
  if (userId)
    query = excludeUser
      ? query.neq("user_id", userId)
      : query.eq("user_id", userId);
  return await query;
}

export function saveRow<T extends Table>(
  table: T,
  values: Insert<T>,
  id?: string,
): Promise<Result<Row<T>[]>>;
export async function saveRow(
  table: Table,
  values: Insert<Table>,
  id?: string,
): Promise<Result<Row<Table>[]>> {
  if (isDemoActive())
    return localResult(() => {
      const data = readDemoData();
      const rows = data[table] as Row<Table>[];
      const existing = id ? rows.find((row) => row.id === id) : undefined;
      if (id && !existing) throw new Error("This demo item no longer exists.");
      const row = {
        created_at: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        user_id: null,
        description: null,
        note: null,
        ...existing,
        ...values,
        id: id || crypto.randomUUID(),
      } as Row<Table>;
      if (id)
        rows.splice(
          rows.findIndex((item) => item.id === id),
          1,
          row,
        );
      else rows.push(row);
      writeDemoData(data);
      return [row];
    });
  // Table-specific callers supply their schema's insert/update shape.
  if (id)
    return (await supabase
      .from(table)
      .update(values)
      .eq("id", id)
      .select()) as Result<Row<Table>[]>;
  return (await supabase.from(table).insert(values).select()) as Result<
    Row<Table>[]
  >;
}

export async function deleteRow(
  table: Table,
  id: string,
): Promise<Result<null>> {
  if (isDemoActive())
    return localResult(() => {
      const data = readDemoData();
      const exerciseIds =
        table === "categories"
          ? data.exercises
              .filter((exercise) => exercise.category_id === id)
              .map((exercise) => exercise.id)
          : table === "exercises"
            ? [id]
            : [];
      data.categories = data.categories.filter(
        (row) => table !== "categories" || row.id !== id,
      );
      data.exercises = data.exercises.filter(
        (row) => !exerciseIds.includes(row.id),
      );
      data.exercise_logs = data.exercise_logs.filter(
        (row) =>
          !(table === "exercise_logs" && row.id === id) &&
          !exerciseIds.includes(row.exercise_id),
      );
      writeDemoData(data);
      return null;
    });
  const { error } = await supabase.from(table).delete().eq("id", id);
  return { data: null, error };
}
