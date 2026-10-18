import type { ApiTask } from '../api/client';

export type AssigneeFilterState = {
  /** Empty with unassignedOnly false = show all */
  userIds: string[];
  unassignedOnly: boolean;
};

export const defaultAssigneeFilter = (): AssigneeFilterState => ({
  userIds: [],
  unassignedOnly: false,
});

export function isAssigneeFilterActive(filter: AssigneeFilterState): boolean {
  return filter.unassignedOnly || filter.userIds.length > 0;
}

export function matchesAssigneeFilter(
  task: Pick<ApiTask, 'assigneeIds'>,
  filter: AssigneeFilterState,
): boolean {
  if (!isAssigneeFilterActive(filter)) return true;
  const ids = (task.assigneeIds || []).map(String);
  if (filter.unassignedOnly) return ids.length === 0;
  const selected = new Set(filter.userIds.map(String));
  return ids.some((id) => selected.has(id));
}

export function filterTasksBySearchAndAssignee(
  tasks: ApiTask[],
  searchQuery: string,
  assigneeFilter: AssigneeFilterState,
): ApiTask[] {
  let filtered = tasks;
  if (isAssigneeFilterActive(assigneeFilter)) {
    filtered = filtered.filter((t) => matchesAssigneeFilter(t, assigneeFilter));
  }
  const q = searchQuery.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((t) => t.name.toLowerCase().includes(q));
  }
  return filtered;
}
