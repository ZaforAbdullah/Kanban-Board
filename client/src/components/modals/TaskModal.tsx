import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

import { Board, Task, SubtaskInput } from '@/types';
import { CREATE_TASK, UPDATE_TASK } from '@/graphql/mutations';
import { GET_BOARD } from '@/graphql/queries';

interface TaskModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  board: Board;
  task?: Task;
  onHide: () => void;
  onSuccess: () => void;
}

interface SubtaskDraft extends SubtaskInput {
  _key: string;
}

function newSubtask(): SubtaskDraft {
  return { _key: `s-${Date.now()}-${Math.random()}`, title: '', isCompleted: false };
}

export default function TaskModal({ visible, mode, board, task, onHide, onSuccess }: TaskModalProps) {
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([newSubtask()]);
  const [errors, setErrors] = useState<{ title?: string; column?: string; subtasks?: string[] }>({});

  const columnOptions = board.columns.map((c) => ({ label: c.name, value: c.id }));

  useEffect(() => {
    if (visible) {
      if (isEdit && task) {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setColumnId(task.columnId);
        setSubtasks(
          task.subtasks.length > 0
            ? task.subtasks.map((s) => ({ _key: s.id, id: s.id, title: s.title, isCompleted: s.isCompleted }))
            : [newSubtask()]
        );
      } else {
        setTitle('');
        setDescription('');
        setColumnId(board.columns[0]?.id ?? '');
        setSubtasks([newSubtask()]);
      }
      setErrors({});
    }
  }, [visible, task, board, isEdit]);

  const [createTask, { loading: creating }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: board.id } }],
    onCompleted: onSuccess,
  });

  const [updateTask, { loading: updating }] = useMutation(UPDATE_TASK, {
    refetchQueries: [{ query: GET_BOARD, variables: { id: board.id } }],
    onCompleted: onSuccess,
  });

  const loading = creating || updating;

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!title.trim()) errs.title = 'Task title is required';
    if (!columnId) errs.column = 'Please select a status';
    const stErrors = subtasks.map((s) => (s.title.trim() ? '' : 'Required'));
    if (stErrors.some(Boolean)) errs.subtasks = stErrors;
    setErrors(errs);
    return !errs.title && !errs.column && !errs.subtasks;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const subtaskInput = subtasks
      .filter((s) => s.title.trim())
      .map((s) => ({ id: s.id, title: s.title.trim(), isCompleted: s.isCompleted }));

    if (isEdit && task) {
      updateTask({
        variables: { id: task.id, title: title.trim(), description, columnId, subtasks: subtaskInput },
      });
    } else {
      createTask({
        variables: { title: title.trim(), description, columnId, subtasks: subtaskInput },
      });
    }
  }

  function addSubtask() {
    setSubtasks((prev) => [...prev, newSubtask()]);
  }

  function removeSubtask(key: string) {
    setSubtasks((prev) => prev.filter((s) => s._key !== key));
  }

  function updateSubtaskTitle(key: string, value: string) {
    setSubtasks((prev) =>
      prev.map((s) => (s._key === key ? { ...s, title: value } : s))
    );
  }

  return (
    <Dialog
      header={isEdit ? 'Edit Task' : 'Add New Task'}
      visible={visible}
      onHide={onHide}
      className="kanban-modal"
      modal
      dismissableMask
      style={{ width: '480px' }}
      breakpoints={{ '768px': '90vw' }}
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Title */}
        <div className="field">
          <label htmlFor="task-title" className="field-label">Title</label>
          <InputText
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Take coffee break"
            className={`w-full ${errors.title ? 'p-invalid' : ''}`}
            autoFocus
          />
          {errors.title && <small className="field-error">{errors.title}</small>}
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="task-desc" className="field-label">Description (optional)</label>
          <InputTextarea
            id="task-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. It's always good to take a break. This 15 minute break will recharge the batteries a little."
            rows={4}
            className="w-full"
            autoResize
          />
        </div>

        {/* Subtasks */}
        <div className="field">
          <label className="field-label">Subtasks</label>
          <div className="subtask-list">
            {subtasks.map((s, idx) => (
              <div key={s._key} className="subtask-input-row">
                <InputText
                  value={s.title}
                  onChange={(e) => updateSubtaskTitle(s._key, e.target.value)}
                  placeholder="e.g. Make coffee"
                  className={`flex-1 ${errors.subtasks?.[idx] ? 'p-invalid' : ''}`}
                  aria-label={`Subtask ${idx + 1}`}
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeSubtask(s._key)}
                  aria-label={`Remove subtask ${idx + 1}`}
                >
                  <i className="pi pi-times" />
                </button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            label="+ Add New Subtask"
            className="btn-secondary w-full mt-2"
            onClick={addSubtask}
            disabled={loading}
          />
        </div>

        {/* Status (column) */}
        <div className="field">
          <label htmlFor="task-status" className="field-label">Status</label>
          <Dropdown
            inputId="task-status"
            value={columnId}
            options={columnOptions}
            onChange={(e) => setColumnId(e.value)}
            placeholder="Select status"
            className={`w-full ${errors.column ? 'p-invalid' : ''}`}
          />
          {errors.column && <small className="field-error">{errors.column}</small>}
        </div>

        <Button
          type="submit"
          label={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
          className="btn-primary w-full"
          loading={loading}
          disabled={loading}
        />
      </form>
    </Dialog>
  );
}
