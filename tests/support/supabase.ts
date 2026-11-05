export const backendCalls: { action: string; args: unknown[] }[] = [];
export const supabase = {
  from(table: string) {
    backendCalls.push({ action: "from", args: [table] });
    const query = {
      select(...args: unknown[]) {
        backendCalls.push({ action: "select", args });
        return query;
      },
      order(...args: unknown[]) {
        backendCalls.push({ action: "order", args });
        return query;
      },
      eq(...args: unknown[]) {
        backendCalls.push({ action: "eq", args });
        return query;
      },
      neq(...args: unknown[]) {
        backendCalls.push({ action: "neq", args });
        return query;
      },
      insert(...args: unknown[]) {
        backendCalls.push({ action: "insert", args });
        return query;
      },
      update(...args: unknown[]) {
        backendCalls.push({ action: "update", args });
        return query;
      },
      delete(...args: unknown[]) {
        backendCalls.push({ action: "delete", args });
        return query;
      },
      then(resolve: (result: unknown) => void) {
        resolve({ data: [], error: null });
      },
    };
    return query;
  },
};
