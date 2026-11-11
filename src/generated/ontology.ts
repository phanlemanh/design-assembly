// Generated from ontology/ by tools/ontology_codegen.py. Do not edit: run `make gen`.


// ---- Roles, actions and personal data (ontology/roles.yaml, actions.yaml)

export type Role = string;

export const ROLE_INHERITS: Readonly<Record<string, readonly Role[]>> = {
};

/** Who runs an action, and as which role. */
export interface ActionContext {
  role: Role;
  actor: string;
}

/** Implement these in src/actions/ — one function per ontology action. */
export interface ActionHandlers {
}

export interface ActionSpec {
  name: keyof ActionHandlers & string;
  description: string;
  entity: string | null;
  kind: "create" | "update" | "delete" | "query" | "command";
  roles: readonly Role[];
  agent: "allowed" | "confirm" | "forbidden";
  idempotent: boolean;
  output: string | null;
  inputSchema: Record<string, unknown>;
}

export const ACTIONS: readonly ActionSpec[] = [];

/** True if `role` (or a role it inherits) may run the action. */
export function can(role: Role, action: ActionSpec): boolean {
  if ((role as string) === "agent" && action.agent === "forbidden") return false;
  const seen = new Set<string>();
  const todo: string[] = [role];
  while (todo.length > 0) {
    const current = todo.pop() as string;
    if ((action.roles as readonly string[]).includes(current)) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    todo.push(...(ROLE_INHERITS[current] ?? []));
  }
  return false;
}

/** Personal-data properties per entity (`pii: true` in the ontology). */
export const PII_FIELDS: Readonly<Record<string, readonly string[]>> = {};

/** Copy of `record` with personal data replaced: use before logging or agent output. */
export function redactPII<T extends object>(entity: string, record: T): T {
  const copy: Record<string, unknown> = { ...(record as Record<string, unknown>) };
  for (const field of PII_FIELDS[entity] ?? []) {
    if (field in copy) copy[field] = "[redacted]";
  }
  return copy as unknown as T;
}
