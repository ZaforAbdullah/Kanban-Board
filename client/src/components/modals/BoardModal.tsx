import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

import { Board, ColumnInput } from '@/types';
import { CREATE_BOARD, UPDATE_BOARD } from '@/graphql/mutations';
import { GET_BOARDS } from '@/graphql/queries';

const DEFAULT_COLORS = ['#49C4E5', '#8471F2', '#67E2AE', '#E98686', '#F0C987', '#BEADFF'];

interface BoardModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  board?: Board;
  onHide: () => void;
  onSuccess: (board: Board) => void;
}

interface ColumnDraft extends ColumnInput {
  _key: string; // local unique key for list rendering
}

function newColumn(index: number): ColumnDraft {
  return {
    _key: `new-${Date.now()}-${index}`,
    name: '',
    color: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  };
}

export default function BoardModal({ visible, mode, board, onHide, onSuccess }: BoardModalProps) {
  const isEdit = mode === 'edit';

  const [name, setName] = useState('');
  const [columns, setColumns] = useState<ColumnDraft[]>([newColumn(0)]);
  const [errors, setErrors] = useState<{ name?: string; columns?: string[] }>({});

  // Populate form when editing
  useEffect(() => {
    if (visible) {
      if (isEdit && board) {
        setName(board.name);
        setColumns(
          board.columns.map((c) => ({
            _key: c.id,
            id: c.id,
            name: c.name,
            color: c.color,
          }))
        );
      } else {
        setName('');
        setColumns([newColumn(0)]);
      }
      setErrors({});
    }
  }, [visible, board, isEdit]);

  const [createBoard, { loading: creating }] = useMutation(CREATE_BOARD, {
    refetchQueries: [{ query: GET_BOARDS }],
    onCompleted: (data) => onSuccess(data.createBoard),
  });

  const [updateBoard, { loading: updating }] = useMutation(UPDATE_BOARD, {
    refetchQueries: [{ query: GET_BOARDS }],
    onCompleted: (data) => onSuccess(data.updateBoard),
  });

  const loading = creating || updating;

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Board name is required';
    const colErrors = columns.map((c) => (c.name.trim() ? '' : 'Column name is required'));
    if (colErrors.some(Boolean)) errs.columns = colErrors;
    setErrors(errs);
    return !errs.name && !errs.columns;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const colInput: ColumnInput[] = columns.map((c) => ({
      id: c.id,
      name: c.name.trim(),
      color: c.color,
    }));

    if (isEdit && board) {
      updateBoard({ variables: { id: board.id, name: name.trim(), columns: colInput } });
    } else {
      createBoard({ variables: { name: name.trim(), columns: colInput } });
    }
  }

  function addColumn() {
    setColumns((prev) => [...prev, newColumn(prev.length)]);
  }

  function removeColumn(key: string) {
    setColumns((prev) => prev.filter((c) => c._key !== key));
  }

  function updateColumn(key: string, field: 'name' | 'color', value: string) {
    setColumns((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    );
  }

  return (
    <Dialog
      header={isEdit ? 'Edit Board' : 'Add New Board'}
      visible={visible}
      onHide={onHide}
      className="kanban-modal"
      modal
      dismissableMask
      style={{ width: '480px' }}
      breakpoints={{ '768px': '90vw' }}
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Board name */}
        <div className="field">
          <label htmlFor="board-name" className="field-label">Board Name</label>
          <InputText
            id="board-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Web Design"
            className={`w-full ${errors.name ? 'p-invalid' : ''}`}
            autoFocus
          />
          {errors.name && <small className="field-error">{errors.name}</small>}
        </div>

        {/* Columns */}
        <div className="field">
          <label className="field-label">Board Columns</label>
          <div className="column-list">
            {columns.map((col, idx) => (
              <div key={col._key} className="column-input-row">
                {/* Color picker */}
                <input
                  type="color"
                  value={col.color}
                  onChange={(e) => updateColumn(col._key, 'color', e.target.value)}
                  className="color-picker"
                  aria-label={`Column ${idx + 1} color`}
                  title="Column color"
                />
                <InputText
                  value={col.name}
                  onChange={(e) => updateColumn(col._key, 'name', e.target.value)}
                  placeholder="e.g. Todo"
                  className={`flex-1 ${errors.columns?.[idx] ? 'p-invalid' : ''}`}
                  aria-label={`Column ${idx + 1} name`}
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeColumn(col._key)}
                  aria-label={`Remove column ${col.name || idx + 1}`}
                  disabled={columns.length === 1}
                >
                  <i className="pi pi-times" />
                </button>
              </div>
            ))}
          </div>
          {errors.columns?.some(Boolean) && (
            <small className="field-error">All column names are required</small>
          )}
        </div>

        <Button
          type="button"
          label="+ Add New Column"
          className="btn-secondary w-full mb-3"
          onClick={addColumn}
          disabled={loading}
        />

        <Button
          type="submit"
          label={loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create New Board'}
          className="btn-primary w-full"
          loading={loading}
          disabled={loading}
        />
      </form>
    </Dialog>
  );
}
