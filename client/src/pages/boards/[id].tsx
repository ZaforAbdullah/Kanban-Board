import React, { useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@apollo/client';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Toast } from 'primereact/toast';

import { GET_BOARD } from '@/graphql/queries';
import { MOVE_TASK } from '@/graphql/mutations';
import { Board, Column, Task } from '@/types';
import Layout from '@/components/layout/Layout';
import BoardColumn from '@/components/board/BoardColumn';
import BoardModal from '@/components/modals/BoardModal';

export default function BoardPage() {
  const router = useRouter();
  const toast = useRef<Toast>(null);
  const boardId = router.query.id as string;

  const [showAddColumn, setShowAddColumn] = React.useState(false);

  const { data, loading, error } = useQuery<{ board: Board }>(GET_BOARD, {
    variables: { id: boardId },
    skip: !boardId,
  });

  const [moveTask] = useMutation(MOVE_TASK, {
    onError: (err) => {
      toast.current?.show({ severity: 'error', summary: 'Move failed', detail: err.message, life: 3000 });
    },
  });

  const board = data?.board;

  /**
   * Optimistically reorder tasks when drag ends, then persist via mutation.
   */
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination || !board) return;

      // Dropped in same position — no-op
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      moveTask({
        variables: {
          id: draggableId,
          columnId: destination.droppableId,
          order: destination.index,
        },
        // Optimistic update: reorder the cache immediately
        optimisticResponse: {
          moveTask: {
            __typename: 'Task',
            id: draggableId,
            columnId: destination.droppableId,
            order: destination.index,
          },
        },
        update: (cache, { data: mutationData }) => {
          if (!mutationData?.moveTask) return;

          // Refresh board from cache
          const cached = cache.readQuery<{ board: Board }>({
            query: GET_BOARD,
            variables: { id: boardId },
          });
          if (!cached) return;

          const movedTask = board.columns
            .flatMap((c) => c.tasks)
            .find((t) => t.id === draggableId);
          if (!movedTask) return;

          const updatedColumns: Column[] = cached.board.columns.map((col) => {
            // Remove from source column
            let tasks = col.tasks.filter((t) => t.id !== draggableId);

            // Insert into destination column
            if (col.id === destination.droppableId) {
              const updatedTask: Task = { ...movedTask, columnId: destination.droppableId, order: destination.index };
              tasks = [
                ...tasks.slice(0, destination.index),
                updatedTask,
                ...tasks.slice(destination.index),
              ].map((t, i) => ({ ...t, order: i }));
            } else {
              tasks = tasks.map((t, i) => ({ ...t, order: i }));
            }

            return { ...col, tasks };
          });

          cache.writeQuery({
            query: GET_BOARD,
            variables: { id: boardId },
            data: { board: { ...cached.board, columns: updatedColumns } },
          });
        },
      });
    },
    [board, boardId, moveTask]
  );

  React.useEffect(() => {
    if (!loading && (error || (!board && boardId))) {
      router.replace('/boards');
    }
  }, [loading, error, board, boardId, router]);

  if (!boardId || loading || !board) {
    return (
      <Layout>
        <div className="board-loading">
          <ProgressSpinner strokeWidth="4" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout board={board}>
      <Toast ref={toast} />

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-view" role="region" aria-label={`${board.name} board`}>
          {/* Existing columns */}
          {board.columns.map((column, index) => (
            <BoardColumn key={column.id} column={column} index={index} />
          ))}

          {/* "+ New Column" sentinel column */}
          <div
            className="add-column-btn"
            onClick={() => setShowAddColumn(true)}
            role="button"
            tabIndex={0}
            aria-label="Add new column"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowAddColumn(true);
              }
            }}
          >
            <span>+ New Column</span>
          </div>
        </div>
      </DragDropContext>

      {/* Edit board to add column */}
      <BoardModal
        visible={showAddColumn}
        mode="edit"
        board={board}
        onHide={() => setShowAddColumn(false)}
        onSuccess={() => setShowAddColumn(false)}
      />
    </Layout>
  );
}
