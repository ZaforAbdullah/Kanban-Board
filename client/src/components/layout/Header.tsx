import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { useMutation } from '@apollo/client';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Toast } from 'primereact/toast';
import { MenuItem } from 'primereact/menuitem';

import { Board } from '@/types';
import { DELETE_BOARD } from '@/graphql/mutations';
import { GET_BOARDS } from '@/graphql/queries';
import TaskModal from '@/components/modals/TaskModal';
import BoardModal from '@/components/modals/BoardModal';
import DeleteModal from '@/components/modals/DeleteModal';

interface HeaderProps {
  board?: Board;
  onMenuToggle: () => void;
  sidebarVisible: boolean;
}

export default function Header({ board, onMenuToggle, sidebarVisible }: HeaderProps) {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const boardMenu = useRef<Menu>(null);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditBoard, setShowEditBoard] = useState(false);
  const [showDeleteBoard, setShowDeleteBoard] = useState(false);

  const [deleteBoard, { loading: deleting }] = useMutation(DELETE_BOARD, {
    variables: { id: board?.id },
    refetchQueries: [{ query: GET_BOARDS }],
    onCompleted: () => {
      toast.current?.show({
        severity: 'success',
        summary: 'Board deleted',
        life: 3000,
      });
      router.push('/boards');
    },
    onError: (err) => {
      toast.current?.show({ severity: 'error', summary: err.message, life: 4000 });
    },
  });

  const boardMenuItems: MenuItem[] = [
    {
      label: 'Edit Board',
      icon: 'pi pi-pencil',
      command: () => setShowEditBoard(true),
    },
    {
      label: 'Delete Board',
      icon: 'pi pi-trash',
      className: 'danger-menu-item',
      command: () => setShowDeleteBoard(true),
    },
  ];

  const hasColumns = Boolean(board?.columns?.length);

  return (
    <>
      <Toast ref={toast} />

      <header className="app-header">
        {/* Left side */}
        <div className="header-left">
          {/* Mobile menu button */}
          <button
            className="header-menu-btn mobile-only"
            onClick={onMenuToggle}
            aria-expanded={sidebarVisible}
            aria-label="Toggle navigation menu"
            type="button"
          >
            <svg width="24" height="25" viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg">
              <g fill="#635FC7" fillRule="evenodd">
                <rect width="6" height="25" rx="2" />
                <rect opacity=".75" x="9" width="6" height="25" rx="2" />
                <rect opacity=".5" x="18" width="6" height="25" rx="2" />
              </g>
            </svg>
            <span className="header-board-name">{board?.name ?? 'Kanban'}</span>
            <i className={`pi ${sidebarVisible ? 'pi-angle-up' : 'pi-angle-down'} header-chevron`} aria-hidden="true" />
          </button>

          {/* Desktop board title */}
          <h1 className="header-title desktop-only">{board?.name ?? ''}</h1>
        </div>

        {/* Right side */}
        <div className="header-right">
          <Button
            label="+ Add Task"
            className="btn-primary header-add-btn"
            onClick={() => setShowAddTask(true)}
            disabled={!board || !hasColumns}
            aria-label="Add new task"
          />

          {board && (
            <>
              <button
                className="header-ellipsis-btn"
                onClick={(e) => boardMenu.current?.toggle(e)}
                aria-label="Board options"
                aria-haspopup="true"
                type="button"
              >
                <svg width="5" height="20" viewBox="0 0 5 20" xmlns="http://www.w3.org/2000/svg">
                  <g fill="currentColor" fillRule="evenodd">
                    <circle cx="2.308" cy="2.308" r="2.308" />
                    <circle cx="2.308" cy="10" r="2.308" />
                    <circle cx="2.308" cy="17.692" r="2.308" />
                  </g>
                </svg>
              </button>
              <Menu ref={boardMenu} model={boardMenuItems} popup />
            </>
          )}
        </div>
      </header>

      {/* Add Task modal */}
      {board && (
        <TaskModal
          visible={showAddTask}
          mode="create"
          board={board}
          onHide={() => setShowAddTask(false)}
          onSuccess={() => setShowAddTask(false)}
        />
      )}

      {/* Edit Board modal */}
      {board && (
        <BoardModal
          visible={showEditBoard}
          mode="edit"
          board={board}
          onHide={() => setShowEditBoard(false)}
          onSuccess={() => setShowEditBoard(false)}
        />
      )}

      {/* Delete Board confirmation */}
      <DeleteModal
        visible={showDeleteBoard}
        title="Delete this board?"
        message={`Are you sure you want to delete the '${board?.name}' board? This action will remove all columns and tasks and cannot be reversed.`}
        onHide={() => setShowDeleteBoard(false)}
        onConfirm={() => {
          setShowDeleteBoard(false);
          deleteBoard();
        }}
        loading={deleting}
      />
    </>
  );
}
