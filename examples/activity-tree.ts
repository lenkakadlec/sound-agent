/**
 * Activity tree builder.
 *
 * Converts a flat list of activities (with parentId foreign keys) into a
 * nested tree in O(n) time by pre-building a childrenMap before recursing.
 *
 * Filters and sort order are applied only at the root level so subtasks
 * always appear in chronological order regardless of the active filter.
 */

import type { ActivityStatus, ActivityType, RecurrenceFrequency } from "@prisma/client";

type RawActivity = {
  id: string;
  title: string;
  type: ActivityType;
  status: ActivityStatus;
  description: string | null;
  dueAt: Date | null;
  recurrenceFreq: RecurrenceFrequency | null;
  assignee: { id: string; name: string | null; email: string } | null;
  category: { id: string; name: string; color: string | null } | null;
  createdAt: Date;
  parentId: string | null;
};

export type ActivityDTO = Omit<RawActivity, "dueAt" | "createdAt" | "recurrenceFreq"> & {
  dueAt: string | null;
  recurrenceFreq: RecurrenceFrequency | null;
  createdAt: string;
  subActivities: ActivityDTO[];
};

export function buildActivityTree(
  all: RawActivity[],
  parentId: string | null,
  statusFilter?: ActivityStatus | string,
  typeFilter?: ActivityType | string,
): ActivityDTO[] {
  // Build the map once — O(n) — rather than filtering on every recursive call.
  const childrenMap = new Map<string | null, RawActivity[]>();

  for (const a of all) {
    const key = a.parentId;

    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(a);
  }
  return buildSubtree(childrenMap, parentId, statusFilter, typeFilter);
}

function buildSubtree(
  childrenMap: Map<string | null, RawActivity[]>,
  parentId: string | null,
  statusFilter: ActivityStatus | string | undefined,
  typeFilter: ActivityType | string | undefined,
): ActivityDTO[] {
  const isRoot = parentId === null;
  const children = childrenMap.get(parentId) ?? [];

  return children
    .filter((a) => {
      if (!isRoot) return true; // subtasks are never filtered
      if (statusFilter && a.status !== statusFilter) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      return true;
    })
    .sort(
      (a, b) =>
        isRoot
          ? b.createdAt.getTime() - a.createdAt.getTime() // newest first at root
          : a.createdAt.getTime() - b.createdAt.getTime(), // chronological for subtasks
    )
    .map((a) => ({
      ...a,
      dueAt: a.dueAt ? a.dueAt.toISOString() : null,
      recurrenceFreq: a.recurrenceFreq ?? null,
      createdAt: a.createdAt.toISOString(),
      subActivities: buildSubtree(childrenMap, a.id, undefined, undefined),
    }));
}
