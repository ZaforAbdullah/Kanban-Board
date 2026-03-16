import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';
import { Toast } from 'primereact/toast';

import { GET_BOARDS } from '@/graphql/queries';
import { Board } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import BoardModal from '@/components/modals/BoardModal';

interface SidebarProps {
  isVisible: boolean;
  onHide: () => void;
}

export default function Sidebar({ isVisible, onHide }: SidebarProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const toast = useRef<Toast>(null);

  const [showCreateBoard, setShowCreateBoard] = useState(false);

  const { data, loading } = useQuery<{ boards: Board[] }>(GET_BOARDS);
  const boards = data?.boards ?? [];
  const activeBoardId = router.query.id as string | undefined;

  return (
    <>
      <Toast ref={toast} />

      {/* Mobile overlay */}
      {isVisible && (
        <div
          className="sidebar-overlay"
          onClick={onHide}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isVisible ? 'sidebar--visible' : ''}`} aria-label="Navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <svg width="24" height="25" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
            <g fill="#635FC7" fillRule="evenodd">
              <rect width="6" height="25" rx="2" />
              <rect opacity=".75" x="9" width="6" height="25" rx="2" />
              <rect opacity=".5" x="18" width="6" height="25" rx="2" />
            </g>
          </svg>
          <span className="sidebar-logo-text">Kanban</span>
        </div>

        {/* Board list */}
        <nav className="sidebar-nav" aria-label="Boards">
          <p className="sidebar-nav-heading">
            All Boards ({loading ? '…' : boards.length})
          </p>

          <ul className="sidebar-board-list" role="list">
            {boards.map((board) => (
              <li key={board.id}>
                <Link
                  href={`/boards/${board.id}`}
                  className={`sidebar-board-item ${board.id === activeBoardId ? 'sidebar-board-item--active' : ''}`}
                  onClick={() => {
                    if (window.innerWidth < 768) onHide();
                  }}
                >
                  <i className="pi pi-th-large sidebar-board-icon" aria-hidden="true" />
                  <span className="sidebar-board-name">{board.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          <button
            className="sidebar-create-btn"
            onClick={() => setShowCreateBoard(true)}
            type="button"
          >
            <i className="pi pi-plus sidebar-board-icon" aria-hidden="true" />
            <span>+ Create New Board</span>
          </button>
        </nav>

        {/* Bottom controls */}
        <div className="sidebar-bottom">
          {/* Theme toggle */}
          <div className="theme-toggle" role="group" aria-label="Theme toggle">
            <i className="pi pi-sun theme-toggle-icon" aria-hidden="true" />
            <button
              className={`toggle-switch ${isDarkMode ? 'toggle-switch--on' : ''}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDarkMode}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              type="button"
            >
              <span className="toggle-thumb" />
            </button>
            <i className="pi pi-moon theme-toggle-icon" aria-hidden="true" />
          </div>

          {/* Hide sidebar (desktop) */}
          <button
            className="sidebar-hide-btn"
            onClick={onHide}
            type="button"
            aria-label="Hide sidebar"
          >
            <i className="pi pi-eye-slash" aria-hidden="true" />
            <span>Hide Sidebar</span>
          </button>

          {/* Logout */}
          <button
            className="sidebar-logout-btn"
            onClick={logout}
            type="button"
            aria-label="Log out"
          >
            <i className="pi pi-sign-out" aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Create board modal */}
      <BoardModal
        visible={showCreateBoard}
        mode="create"
        onHide={() => setShowCreateBoard(false)}
        onSuccess={(board) => {
          setShowCreateBoard(false);
          router.push(`/boards/${board.id}`);
        }}
      />
    </>
  );
}
