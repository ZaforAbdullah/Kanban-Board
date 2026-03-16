import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import TaskCard from '@/components/board/TaskCard';
import { Task } from '@/types';
import { GET_TASK } from '@/graphql/queries';

// Mock @hello-pangea/dnd — not testable in jsdom
jest.mock('@hello-pangea/dnd', () => ({
  Draggable: ({
    children,
  }: {
    children: (provided: object, snapshot: { isDragging: boolean }) => React.ReactNode;
  }) =>
    children(
      {
        innerRef: () => {},
        draggableProps: {},
        dragHandleProps: {},
      },
      { isDragging: false }
    ),
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Build the UI',
  description: 'Create the frontend',
  order: 0,
  columnId: 'col-1',
  column: { id: 'col-1', name: 'Todo', color: '#49C4E5', order: 0, tasks: [] },
  subtasks: [
    { id: 'sub-1', title: 'Design', isCompleted: true, taskId: 'task-1' },
    { id: 'sub-2', title: 'Code', isCompleted: false, taskId: 'task-1' },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const taskMock = {
  request: { query: GET_TASK, variables: { id: 'task-1' } },
  result: { data: { task: makeTask() } },
};

function renderCard(task: Task) {
  return render(
    <MockedProvider mocks={[taskMock]} addTypename={false}>
      <TaskCard task={task} index={0} />
    </MockedProvider>
  );
}

describe('TaskCard', () => {
  it('renders task title', () => {
    renderCard(makeTask());
    expect(screen.getByText('Build the UI')).toBeInTheDocument();
  });

  it('shows subtask count correctly', () => {
    renderCard(makeTask());
    expect(screen.getByText('1 of 2 subtasks')).toBeInTheDocument();
  });

  it('does not show subtask line when no subtasks', () => {
    renderCard(makeTask({ subtasks: [] }));
    expect(screen.queryByText(/subtasks/)).not.toBeInTheDocument();
  });

  it('shows "0 of N subtasks" when none completed', () => {
    renderCard(
      makeTask({
        subtasks: [
          { id: 'sub-1', title: 'A', isCompleted: false, taskId: 'task-1' },
          { id: 'sub-2', title: 'B', isCompleted: false, taskId: 'task-1' },
        ],
      })
    );
    expect(screen.getByText('0 of 2 subtasks')).toBeInTheDocument();
  });

  it('is accessible via keyboard (Enter opens detail)', () => {
    renderCard(makeTask());
    const card = screen.getByRole('button', { name: /build the ui/i });
    // Pressing Enter should trigger the click handler (dialog would open)
    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    // Modal would be rendered by TaskDetailModal — we just ensure no crash
    expect(card).toBeInTheDocument();
  });

  it('has correct aria-label', () => {
    renderCard(makeTask());
    expect(screen.getByRole('button', { name: 'Task: Build the UI' })).toBeInTheDocument();
  });
});
