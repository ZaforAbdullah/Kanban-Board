import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column } from '@/types';
import TaskCard from './TaskCard';

interface BoardColumnProps {
  column: Column;
  index: number;
}

export default function BoardColumn({ column, index }: BoardColumnProps) {
  return (
    <section className="board-column" aria-label={`${column.name} column`}>
      {/* Column header */}
      <header className="column-header">
        <span
          className="column-dot"
          style={{ backgroundColor: column.color }}
          aria-hidden="true"
        />
        <h2 className="column-title">
          {column.name.toUpperCase()} ({column.tasks.length})
        </h2>
      </header>

      {/* Droppable task list */}
      <Droppable droppableId={column.id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-tasks ${snapshot.isDraggingOver ? 'column-tasks--over' : ''}`}
            role="list"
            aria-label={`Tasks in ${column.name}`}
          >
            {column.tasks.map((task, taskIndex) => (
              <TaskCard key={task.id} task={task} index={taskIndex} />
            ))}
            {provided.placeholder}

            {column.tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="column-empty" role="listitem" aria-label="Empty column">
                Drop tasks here
              </div>
            )}
          </div>
        )}
      </Droppable>
    </section>
  );
}
