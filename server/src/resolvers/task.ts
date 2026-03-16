import { GraphQLError } from 'graphql';
import { AuthContext } from '../middleware/auth';

interface SubtaskInput {
  id?: string;
  title: string;
  isCompleted?: boolean;
}

function requireAuth(user: AuthContext['user']): asserts user is NonNullable<AuthContext['user']> {
  if (!user) {
    throw new GraphQLError('You must be logged in', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

/** Verify the column belongs to one of the authenticated user's boards */
async function verifyColumnOwnership(
  columnId: string,
  userId: string,
  prisma: AuthContext['prisma']
) {
  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { userId } },
  });
  if (!column) {
    throw new GraphQLError('Column not found', { extensions: { code: 'NOT_FOUND' } });
  }
  return column;
}

/** Verify the task belongs to the authenticated user */
async function verifyTaskOwnership(
  taskId: string,
  userId: string,
  prisma: AuthContext['prisma']
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, column: { board: { userId } } },
    include: { subtasks: true, column: true },
  });
  if (!task) {
    throw new GraphQLError('Task not found', { extensions: { code: 'NOT_FOUND' } });
  }
  return task;
}

export const taskResolvers = {
  Query: {
    task: async (_: unknown, { id }: { id: string }, { user, prisma }: AuthContext) => {
      requireAuth(user);

      const task = await prisma.task.findFirst({
        where: { id, column: { board: { userId: user.userId } } },
        include: { subtasks: true, column: true },
      });

      if (!task) {
        throw new GraphQLError('Task not found', { extensions: { code: 'NOT_FOUND' } });
      }

      return task;
    },
  },

  Mutation: {
    createTask: async (
      _: unknown,
      {
        title,
        description,
        columnId,
        subtasks,
      }: { title: string; description?: string; columnId: string; subtasks?: SubtaskInput[] },
      { user, prisma }: AuthContext
    ) => {
      requireAuth(user);
      await verifyColumnOwnership(columnId, user.userId, prisma);

      if (!title.trim()) {
        throw new GraphQLError('Task title cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Calculate next order
      const lastTask = await prisma.task.findFirst({
        where: { columnId },
        orderBy: { order: 'desc' },
      });
      const order = lastTask ? lastTask.order + 1 : 0;

      return prisma.task.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          order,
          columnId,
          subtasks: subtasks?.length
            ? {
                create: subtasks
                  .filter((s) => s.title.trim())
                  .map((s) => ({
                    title: s.title.trim(),
                    isCompleted: s.isCompleted ?? false,
                  })),
              }
            : undefined,
        },
        include: { subtasks: true, column: true },
      });
    },

    updateTask: async (
      _: unknown,
      {
        id,
        title,
        description,
        columnId,
        subtasks,
      }: {
        id: string;
        title: string;
        description?: string;
        columnId: string;
        subtasks?: SubtaskInput[];
      },
      { user, prisma }: AuthContext
    ) => {
      requireAuth(user);
      await verifyTaskOwnership(id, user.userId, prisma);
      await verifyColumnOwnership(columnId, user.userId, prisma);

      if (!title.trim()) {
        throw new GraphQLError('Task title cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Sync subtasks: delete removed, upsert existing/new
      const existingSubtasks = await prisma.subtask.findMany({ where: { taskId: id } });
      const existingIds = existingSubtasks.map((s) => s.id);
      const incomingIds = (subtasks ?? []).filter((s) => s.id).map((s) => s.id as string);

      const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
      if (toDelete.length > 0) {
        await prisma.subtask.deleteMany({ where: { id: { in: toDelete } } });
      }

      if (subtasks?.length) {
        for (const sub of subtasks.filter((s) => s.title.trim())) {
          if (sub.id) {
            await prisma.subtask.update({
              where: { id: sub.id },
              data: { title: sub.title.trim(), isCompleted: sub.isCompleted ?? false },
            });
          } else {
            await prisma.subtask.create({
              data: {
                title: sub.title.trim(),
                isCompleted: sub.isCompleted ?? false,
                taskId: id,
              },
            });
          }
        }
      }

      return prisma.task.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          columnId,
        },
        include: { subtasks: true, column: true },
      });
    },

    deleteTask: async (_: unknown, { id }: { id: string }, { user, prisma }: AuthContext) => {
      requireAuth(user);
      await verifyTaskOwnership(id, user.userId, prisma);

      await prisma.task.delete({ where: { id } });
      return true;
    },

    moveTask: async (
      _: unknown,
      { id, columnId, order }: { id: string; columnId: string; order: number },
      { user, prisma }: AuthContext
    ) => {
      requireAuth(user);
      await verifyTaskOwnership(id, user.userId, prisma);
      await verifyColumnOwnership(columnId, user.userId, prisma);

      // Reorder tasks in target column to make room
      await prisma.task.updateMany({
        where: { columnId, order: { gte: order }, id: { not: id } },
        data: { order: { increment: 1 } },
      });

      return prisma.task.update({
        where: { id },
        data: { columnId, order },
        include: { subtasks: true, column: true },
      });
    },

    toggleSubtask: async (_: unknown, { id }: { id: string }, { user, prisma }: AuthContext) => {
      requireAuth(user);

      const subtask = await prisma.subtask.findFirst({
        where: { id, task: { column: { board: { userId: user.userId } } } },
      });

      if (!subtask) {
        throw new GraphQLError('Subtask not found', { extensions: { code: 'NOT_FOUND' } });
      }

      return prisma.subtask.update({
        where: { id },
        data: { isCompleted: !subtask.isCompleted },
      });
    },
  },
};
