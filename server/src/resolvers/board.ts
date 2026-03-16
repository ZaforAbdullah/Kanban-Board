import { GraphQLError } from 'graphql';
import { AuthContext } from '../middleware/auth';

interface ColumnInput {
  id?: string;
  name: string;
  color?: string;
}

function requireAuth(user: AuthContext['user']): asserts user is NonNullable<AuthContext['user']> {
  if (!user) {
    throw new GraphQLError('You must be logged in', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

function requireBoard(board: unknown, boardId: string): asserts board is NonNullable<typeof board> {
  if (!board) {
    throw new GraphQLError(`Board ${boardId} not found`, {
      extensions: { code: 'NOT_FOUND' },
    });
  }
}

export const boardResolvers = {
  Query: {
    boards: async (_: unknown, __: unknown, { user, prisma }: AuthContext) => {
      requireAuth(user);
      return prisma.board.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'asc' },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
                include: { subtasks: true },
              },
            },
          },
        },
      });
    },

    board: async (_: unknown, { id }: { id: string }, { user, prisma }: AuthContext) => {
      requireAuth(user);
      const board = await prisma.board.findFirst({
        where: { id, userId: user.userId },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
                include: { subtasks: true },
              },
            },
          },
        },
      });
      requireBoard(board, id);
      return board;
    },
  },

  Mutation: {
    createBoard: async (
      _: unknown,
      { name, columns }: { name: string; columns?: ColumnInput[] },
      { user, prisma }: AuthContext
    ) => {
      requireAuth(user);

      if (!name.trim()) {
        throw new GraphQLError('Board name cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const defaultColors = ['#49C4E5', '#8471F2', '#67E2AE', '#E98686', '#F0C987'];

      return prisma.board.create({
        data: {
          name: name.trim(),
          userId: user.userId,
          columns: columns?.length
            ? {
                create: columns.map((col, idx) => ({
                  name: col.name.trim(),
                  color: col.color ?? defaultColors[idx % defaultColors.length],
                  order: idx,
                })),
              }
            : undefined,
        },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: { tasks: { include: { subtasks: true } } },
          },
        },
      });
    },

    updateBoard: async (
      _: unknown,
      { id, name, columns }: { id: string; name: string; columns?: ColumnInput[] },
      { user, prisma }: AuthContext
    ) => {
      requireAuth(user);

      const board = await prisma.board.findFirst({ where: { id, userId: user.userId } });
      requireBoard(board, id);

      if (!name.trim()) {
        throw new GraphQLError('Board name cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const defaultColors = ['#49C4E5', '#8471F2', '#67E2AE', '#E98686', '#F0C987'];

      // Get existing column ids
      const existingColumns = await prisma.column.findMany({ where: { boardId: id } });
      const existingIds = existingColumns.map((c) => c.id);
      const incomingIds = (columns ?? []).filter((c) => c.id).map((c) => c.id as string);

      // Delete columns not in the new list
      const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
      if (toDelete.length > 0) {
        await prisma.column.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Upsert columns
      if (columns?.length) {
        for (let idx = 0; idx < columns.length; idx++) {
          const col = columns[idx];
          if (col.id) {
            // Update existing
            await prisma.column.update({
              where: { id: col.id },
              data: {
                name: col.name.trim(),
                color: col.color ?? defaultColors[idx % defaultColors.length],
                order: idx,
              },
            });
          } else {
            // Create new
            await prisma.column.create({
              data: {
                name: col.name.trim(),
                color: col.color ?? defaultColors[idx % defaultColors.length],
                order: idx,
                boardId: id,
              },
            });
          }
        }
      }

      return prisma.board.update({
        where: { id },
        data: { name: name.trim() },
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
                include: { subtasks: true },
              },
            },
          },
        },
      });
    },

    deleteBoard: async (
      _: unknown,
      { id }: { id: string },
      { user, prisma }: AuthContext
    ) => {
      requireAuth(user);

      const board = await prisma.board.findFirst({ where: { id, userId: user.userId } });
      requireBoard(board, id);

      await prisma.board.delete({ where: { id } });
      return true;
    },
  },
};
