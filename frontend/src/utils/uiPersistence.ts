import type { ViewType } from '../store/useAppStore';

const PROJECT_KEY = 'flowdesk_project';
const VIEW_KEY = 'flowdesk_view';

const VIEWS: ViewType[] = ['list', 'board', 'calendar'];

function parseView(raw: string | null): ViewType | null {
  if (raw && VIEWS.includes(raw as ViewType)) return raw as ViewType;
  return null;
}

export function getPersistedUiState(): { projectId: string | null; view: ViewType } {
  const params = new URLSearchParams(window.location.search);
  const projectId =
    params.get('project') || localStorage.getItem(PROJECT_KEY) || null;
  const view =
    parseView(params.get('view')) ||
    parseView(localStorage.getItem(VIEW_KEY)) ||
    'list';
  return { projectId, view };
}

export function syncUiState(projectId: string | null, view: ViewType) {
  if (projectId) localStorage.setItem(PROJECT_KEY, projectId);
  else localStorage.removeItem(PROJECT_KEY);
  localStorage.setItem(VIEW_KEY, view);

  const params = new URLSearchParams();
  if (projectId) params.set('project', projectId);
  if (view !== 'list') params.set('view', view);
  const qs = params.toString();
  const next = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  if (`${window.location.pathname}${window.location.search}` !== next) {
    window.history.replaceState(null, '', next);
  }
}
