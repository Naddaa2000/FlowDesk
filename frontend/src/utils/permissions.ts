import type { ApiProject, ApiUser } from '../api/client';

/** Global admin or project lead can manage status groups / members */
export function canManageGroups(
  user: ApiUser | null | undefined,
  project: ApiProject | null | undefined,
): boolean {
  if (!user || !project) return false;
  if (user.role === 'admin') return true;
  if (String(project.leadId) === String(user.id)) return true;
  return Boolean(
    project.members?.some(
      (m) => m.user.id === user.id && m.role === 'lead' && m.status === 'active',
    ),
  );
}
