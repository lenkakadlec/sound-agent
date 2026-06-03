/**
 * Role-based access control.
 *
 * A single permission matrix keyed by role. Every server action and AI tool
 * call passes through `can()` before touching the database — there is no
 * second place where permissions are checked.
 *
 * Adding a new permission is one line in the matrix; the TypeScript union
 * makes it a compile error to reference an action that doesn't exist.
 */

import { Role } from "@prisma/client";

export type Action =
  | "project.read"
  | "project.create"
  | "project.update"
  | "project.delete"
  | "activity.read"
  | "activity.create"
  | "activity.update"
  | "activity.delete"
  | "audit.read"
  | "member.read"
  | "member.invite"
  | "member.manage";

const matrix: Record<Role, Set<Action>> = {
  OWNER: new Set([
    "project.read",
    "project.create",
    "project.update",
    "project.delete",
    "activity.read",
    "activity.create",
    "activity.update",
    "activity.delete",
    "audit.read",
    "member.read",
    "member.invite",
    "member.manage",
  ]),
  ADMIN: new Set([
    "project.read",
    "project.create",
    "project.update",
    "project.delete",
    "activity.read",
    "activity.create",
    "activity.update",
    "activity.delete",
    "audit.read",
    "member.read",
  ]),
  MEMBER: new Set([
    "project.read",
    "project.create",
    "project.update",
    "activity.read",
    "activity.create",
    "activity.update",
    "member.read",
  ]),
  VIEWER: new Set(["project.read", "activity.read", "member.read"]),
};

export function can(role: Role, action: Action): boolean {
  return matrix[role]?.has(action) ?? false;
}

// Usage in a server action:
//
//   const { role } = await requireMembership();
//   if (!can(role, "activity.delete")) throw new Error("FORBIDDEN");
//   await prisma.activity.update({ ... });
