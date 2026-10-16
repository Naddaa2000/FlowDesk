import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { filterTasksBySearchAndAssignee } from '../utils/taskFilters';

export function useFilteredTasks() {
  const { tasks, searchQuery, assigneeFilter } = useAppStore();
  return useMemo(
    () => filterTasksBySearchAndAssignee(tasks, searchQuery, assigneeFilter),
    [tasks, searchQuery, assigneeFilter],
  );
}
