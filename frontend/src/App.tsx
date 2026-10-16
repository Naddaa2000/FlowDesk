import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { WorkspaceView } from './components/WorkspaceView';
import { TaskDrawer } from './components/TaskDrawer';
import { CreateModal } from './components/CreateModal';
import { StatusManagerModal } from './components/StatusManagerModal';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const {
    bootstrapped,
    currentUser,
    bootstrap,
    loading,
  } = useAppStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (!bootstrapped) {
    return (
      <div className="auth-page">
        <p style={{ color: 'var(--text-muted)' }}>
          {loading ? 'Loading…' : 'Starting FlowDesk…'}
        </p>
      </div>
    );
  }

  if (!currentUser) return <LoginPage />;

  return (
    <AppShell />
  );
}

function AppShell() {
  const { showStatusManager, setShowStatusManager } = useAppStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar
        mobileOpen={sidebarOpen}
        onNavigate={() => setSidebarOpen(false)}
      />
      <div className="main">
        <Topbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <WorkspaceView />
      </div>
      <TaskDrawer />
      <CreateModal />
      <StatusManagerModal
        open={showStatusManager}
        onClose={() => setShowStatusManager(false)}
      />
    </div>
  );
}
