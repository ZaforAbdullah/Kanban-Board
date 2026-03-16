import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { boardResolvers } from '../resolvers/board';

const prismaMock = mockDeep<PrismaClient>();

const authUser = { userId: 'user-1', email: 'user@example.com' };
const mockContext = (authed = true) => ({
  user: authed ? authUser : null,
  prisma: prismaMock as unknown as PrismaClient,
});

beforeEach(() => jest.clearAllMocks());

const sampleBoard = {
  id: 'board-1',
  name: 'Test Board',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  columns: [],
};

describe('Board Resolvers', () => {
  describe('boards query', () => {
    it('throws when not authenticated', async () => {
      await expect(
        boardResolvers.Query.boards({}, {}, mockContext(false))
      ).rejects.toThrow('logged in');
    });

    it('returns boards for authenticated user', async () => {
      prismaMock.board.findMany.mockResolvedValue([sampleBoard] as any);

      const result = await boardResolvers.Query.boards({}, {}, mockContext());
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Board');
    });
  });

  describe('board query', () => {
    it('returns board by id for owner', async () => {
      prismaMock.board.findFirst.mockResolvedValue(sampleBoard as any);

      const result = await boardResolvers.Query.board({}, { id: 'board-1' }, mockContext());
      expect(result?.id).toBe('board-1');
    });

    it('throws when board not found', async () => {
      prismaMock.board.findFirst.mockResolvedValue(null);

      await expect(
        boardResolvers.Query.board({}, { id: 'non-existent' }, mockContext())
      ).rejects.toThrow('not found');
    });
  });

  describe('createBoard mutation', () => {
    it('creates a board with columns', async () => {
      prismaMock.board.create.mockResolvedValue({
        ...sampleBoard,
        name: 'New Board',
        columns: [{ id: 'col-1', name: 'Todo', color: '#49C4E5', order: 0, tasks: [] }],
      } as any);

      const result = await boardResolvers.Mutation.createBoard(
        {},
        { name: 'New Board', columns: [{ name: 'Todo' }] },
        mockContext()
      );

      expect(result.name).toBe('New Board');
      expect(prismaMock.board.create).toHaveBeenCalledTimes(1);
    });

    it('throws when name is empty', async () => {
      await expect(
        boardResolvers.Mutation.createBoard({}, { name: '  ' }, mockContext())
      ).rejects.toThrow('cannot be empty');
    });

    it('throws when not authenticated', async () => {
      await expect(
        boardResolvers.Mutation.createBoard({}, { name: 'Board' }, mockContext(false))
      ).rejects.toThrow('logged in');
    });
  });

  describe('deleteBoard mutation', () => {
    it('deletes board and returns true', async () => {
      prismaMock.board.findFirst.mockResolvedValue(sampleBoard as any);
      prismaMock.board.delete.mockResolvedValue(sampleBoard as any);

      const result = await boardResolvers.Mutation.deleteBoard(
        {},
        { id: 'board-1' },
        mockContext()
      );

      expect(result).toBe(true);
    });

    it('throws when board not found', async () => {
      prismaMock.board.findFirst.mockResolvedValue(null);

      await expect(
        boardResolvers.Mutation.deleteBoard({}, { id: 'not-mine' }, mockContext())
      ).rejects.toThrow('not found');
    });
  });
});
