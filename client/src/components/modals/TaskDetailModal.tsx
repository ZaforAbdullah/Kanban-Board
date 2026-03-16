import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { Menu } from 'primereact/menu';
import { ProgressBar } from 'primereact/progressbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';

import { GET_TASK, GET_BOARD, GET_BOARDS } from '@/graphql/queries';
import { TOGGLE_SUBTASK, DELETE_TASK } from '@/graphql/mutations';
import { Task, Subtask, Board } from '@/types';
import TaskModal from './TaskModal';
import DeleteModal from './DeleteModal';

interface TaskDetailModalProps {
  taskId: string;
  visible: boolean;
  onHide: () => void;
}

export default function TaskDetailModal({ taskId, visible, onHide }: TaskDetailModalProps) {
  const toast = useRef<Toast>(null);
  const taskMenu = useRef<Menu>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: taskData, loading } = useQuery<{ task: Task }>(GET_TASK, {
    variables: { id: taskId },
    skip: !visible || !taskId,
    fetchPolicy: 'cache-and-network',
  });

  const task = taskData?.task;

  // Once we have the task, fetch its parent board for the edit form's column dropdown
  // We pull this from the boards list query (already in cache)
  const { data: boardsData } = useQuery<{ boards: Board[] }>(GET_BOARDS, {
    skip: !showEdit,
  });

  // Find the board that contains our task's column
  const editBoard = boardsData?.boards.find((b) =>
    b.columns.some((c) => c.id === task?.columnId)
  );

  const [toggleSubtask] = useMutation(TOGGLE_SUBTASK, {
    onError: (err) => {
      toast.current?.show({ severity: 'error', summary: err.message, life: 3000 });
    },
  });

  const [deleteTask, { loading: deleting }] = useMutation(DELETE_TASK, {
    variables: { id: taskId },
    refetchQueries: task
      ? [{ query: GET_BOARD, variables: { id: findBoardId(boardsData?.boards, task.columnId) } }]
      : [],
    awaitRefetchQueries: true,
    onCompleted: () => {
      onHide();
      toast.current?.show({ severity: 'success', summary: 'Task deleted', life: 3000 });
    },
    onError: (err) => {
      toast.current?.show({ severity: 'error', summary: err.message, life: 3000 });
    },
  });

  function handleToggleSubtask(subtask: Subtask) {
    toggleSubtask({
      variables: { id: subtask.id },
      optimisticResponse: {
        toggleSubtask: {
          __typename: 'Subtask',
          id: subtask.id,
          isCompleted: !subtask.isCompleted,
          taskId: subtask.taskId,
        },
      },
    });
  }

  const completedCount = task?.subtasks.filter((s) => s.isCompleted).length ?? 0;
  const totalCount = task?.subtasks.length ?? 0;
  const progressValue = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const menuItems = [
    {
      label: 'Edit Task',
      icon: 'pi pi-pencil',
      command: () => setShowEdit(true),
    },
    {
      label: 'Delete Task',
      icon: 'pi pi-trash',
      className: 'danger-menu-item',
      command: () => setShowDelete(true),
    },
  ];

  const header = (
    <div className="task-detail-header">
      <span className="task-detail-title">{task?.title ?? '…'}</span>
      <button
        className="header-ellipsis-btn"
        onClick={(e) => taskMenu.current?.toggle(e)}
        aria-label="Task options"
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
      <Menu ref={taskMenu} model={menuItems} popup />
    </div>
  );

  return (
    <>
      <Toast ref={toast} />

      <Dialog
        header={header}
        visible={visible}
        onHide={() => {
          if (!showEdit && !showDelete) onHide();
        }}
        className="kanban-modal task-detail-modal"
        modal
        dismissableMask={!showEdit && !showDelete}
        style={{ width: '480px' }}
        breakpoints={{ '768px': '90vw' }}
      >
        {loading && !task && (
          <div className="modal-loading">
            <ProgressSpinner strokeWidth="4" />
          </div>
        )}

        {task && (
          <>
            {task.description && (
              <p className="task-detail-description">{task.description}</p>
            )}

            {totalCount > 0 && (
              <div className="task-detail-subtasks">
                <p className="field-label">
                  Subtasks ({completedCount} of {totalCount})
                </p>
                <ProgressBar
                  value={progressValue}
                  showValue={false}
                  className="subtask-progress"
                  aria-label={`${progressValue}% complete`}
                />
                <ul className="subtask-checklist" role="list">
                  {task.subtasks.map((subtask) => (
                    <li
                      key={subtask.id}
                      className={`subtask-item ${subtask.isCompleted ? 'subtask-item--done' : ''}`}
                      role="listitem"
                    >
                      <Checkbox
                        inputId={subtask.id}
                        checked={subtask.isCompleted}
                        onChange={() => handleToggleSubtask(subtask)}
                        aria-label={subtask.title}
                      />
                      <label htmlFor={subtask.id} className="subtask-label">
                        {subtask.title}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="task-detail-status">
              <p className="field-label">Current Status</p>
              <div className="task-status-badge">
                <span
                  className="column-dot"
                  style={{ backgroundColor: task.column.color }}
                  aria-hidden="true"
                />
                <span>{task.column.name}</span>
              </div>
            </div>
          </>
        )}
      </Dialog>

      {/* Edit task modal — only shown after we have the parent board */}
      {task && editBoard && (
        <TaskModal
          visible={showEdit}
          mode="edit"
          board={editBoard}
          task={task}
          onHide={() => setShowEdit(false)}
          onSuccess={() => setShowEdit(false)}
        />
      )}

      {/* Delete confirmation */}
      <DeleteModal
        visible={showDelete}
        title="Delete this task?"
        message={`Are you sure you want to delete the '${task?.title}' task and its subtasks? This action cannot be reversed.`}
        onHide={() => setShowDelete(false)}
        onConfirm={() => {
          setShowDelete(false);
          deleteTask();
        }}
        loading={deleting}
      />
    </>
  );
}

// Helper — find the board ID that contains a given column
function findBoardId(boards: Board[] | undefined, columnId: string): string {
  if (!boards) return '';
  const board = boards.find((b) => b.columns.some((c) => c.id === columnId));
  return board?.id ?? '';
}
