import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Board } from '@/types';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  board?: Board;
}

export default function Layout({ children, board }: LayoutProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Show nothing while auth is loading to prevent flash
  if (isLoading || !isAuthenticated) return null;

  return (
    <div className={`app-layout ${sidebarVisible ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        isVisible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
      />

      {/* Show sidebar toggle when hidden (desktop only) */}
      {!sidebarVisible && (
        <button
          className="sidebar-show-btn desktop-only"
          onClick={() => setSidebarVisible(true)}
          aria-label="Show sidebar"
          type="button"
        >
          <i className="pi pi-eye" aria-hidden="true" />
        </button>
      )}

      <div className="app-main">
        <Header
          board={board}
          onMenuToggle={() => setSidebarVisible((v) => !v)}
          sidebarVisible={sidebarVisible}
        />
        <main className="app-content" role="main">
          {children}
        </main>
      </div>
    </div>
  );
}
