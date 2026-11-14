// Generated from ontology/ by tools/ontology_codegen.py. Do not edit: run `make gen`.

export type ItemStatus = "active" | "pending" | "overdue";

/** The sample record the reference screen lists. It stands in for a real business record. */
export interface Item {
  id: number;
  name: string;
  status: ItemStatus;
  /** ISO date */
  date: string;
  total: number;
}

// ---- Roles, actions and personal data (ontology/roles.yaml, actions.yaml)

export type Role = "user";

export const ROLE_INHERITS: Readonly<Record<string, readonly Role[]>> = {
  "user": [],
};

/** Who runs an action, and as which role. */
export interface ActionContext {
  role: Role;
  actor: string;
}

export interface ListItemsInput {
}

export interface CreateItemInput {
}

export interface DeleteItemInput {
  id: number;
}

/** Implement these in src/actions/ — one function per ontology action. */
export interface ActionHandlers {
  /** A person sees the sample items of the list; the overdue screen shows the same items, filtered. */
  listItems(input: ListItemsInput, ctx: ActionContext): Promise<Item[]>;
  /** A person adds a sample item to the list. It is done at once and taken back by deleteItem. */
  createItem(input: CreateItemInput, ctx: ActionContext): Promise<Item>;
  /** A person deletes an item from the list, after confirming. It cannot be taken back. */
  deleteItem(input: DeleteItemInput, ctx: ActionContext): Promise<void>;
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

export const ACTIONS: readonly ActionSpec[] = [
  {
    name: "listItems",
    description: "A person sees the sample items of the list; the overdue screen shows the same items, filtered.",
    entity: "Item",
    kind: "query",
    roles: ["user"],
    agent: "forbidden",
    idempotent: true,
    output: "Item[]",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "createItem",
    description: "A person adds a sample item to the list. It is done at once and taken back by deleteItem.",
    entity: "Item",
    kind: "create",
    roles: ["user"],
    agent: "forbidden",
    idempotent: false,
    output: "Item",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "deleteItem",
    description: "A person deletes an item from the list, after confirming. It cannot be taken back.",
    entity: "Item",
    kind: "delete",
    roles: ["user"],
    agent: "forbidden",
    idempotent: true,
    output: null,
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "integer",
        },
      },
      additionalProperties: false,
      required: ["id"],
    },
  },
];

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
