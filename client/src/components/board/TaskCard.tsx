import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Task } from '@/types';
import TaskDetailModal from '@/components/modals/TaskDetailModal';

interface TaskCardProps {
  task: Task;
  index: number;
}

export default function TaskCard({ task, index }: TaskCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  const completedCount = task.subtasks.filter((s) => s.isCompleted).length;
  const totalCount = task.subtasks.length;

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <article
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task-card ${snapshot.isDragging ? 'task-card--dragging' : ''}`}
            onClick={() => setShowDetail(true)}
            role="button"
            tabIndex={0}
            aria-label={`Task: ${task.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowDetail(true);
              }
            }}
          >
            <h3 className="task-card-title">{task.title}</h3>
            {totalCount > 0 && (
              <p className="task-card-subtasks" aria-label={`${completedCount} of ${totalCount} subtasks completed`}>
                {completedCount} of {totalCount} subtasks
              </p>
            )}
          </article>
        )}
      </Draggable>

      <TaskDetailModal
        taskId={task.id}
        visible={showDetail}
        onHide={() => setShowDetail(false)}
      />
    </>
  );
}
