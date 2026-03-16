import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

interface DeleteModalProps {
  visible: boolean;
  title: string;
  message: string;
  onHide: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function DeleteModal({
  visible,
  title,
  message,
  onHide,
  onConfirm,
  loading = false,
}: DeleteModalProps) {
  return (
    <Dialog
      header={title}
      visible={visible}
      onHide={onHide}
      className="delete-modal"
      headerClassName="delete-modal-header"
      modal
      dismissableMask
      style={{ width: '480px' }}
      breakpoints={{ '768px': '90vw' }}
    >
      <p className="delete-modal-message">{message}</p>
      <div className="modal-actions">
        <Button
          label={loading ? 'Deleting…' : 'Delete'}
          className="btn-danger"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
          autoFocus
        />
        <Button
          label="Cancel"
          className="btn-secondary"
          onClick={onHide}
          disabled={loading}
        />
      </div>
    </Dialog>
  );
}
