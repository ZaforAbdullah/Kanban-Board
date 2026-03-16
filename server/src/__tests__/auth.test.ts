import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { authResolvers } from '../resolvers/auth';
import { hashPassword } from '../utils/password';
import { verifyToken } from '../utils/jwt';

// Mock PrismaClient
const prismaMock = mockDeep<PrismaClient>();

const mockContext = (userOverride?: { userId: string; email: string } | null) => ({
  user: userOverride !== undefined ? userOverride : null,
  prisma: prismaMock as unknown as PrismaClient,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth Resolvers', () => {
  describe('register', () => {
    it('creates a new user and returns a valid JWT', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      // User doesn't exist yet
      prismaMock.user.findUnique.mockResolvedValue(null);

      const createdUser = {
        id: 'user-1',
        email,
        password: await hashPassword(password),
        boards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.user.create.mockResolvedValue(createdUser as any);

      const result = await authResolvers.Mutation.register(
        {},
        { email, password },
        mockContext()
      );

      expect(result.user.email).toBe(email);
      expect(result.token).toBeDefined();
      const decoded = verifyToken(result.token);
      expect(decoded?.userId).toBe('user-1');
    });

    it('throws when email is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'existing@example.com',
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        authResolvers.Mutation.register(
          {},
          { email: 'existing@example.com', password: 'password123' },
          mockContext()
        )
      ).rejects.toThrow('already exists');
    });

    it('throws when email is invalid', async () => {
      await expect(
        authResolvers.Mutation.register(
          {},
          { email: 'not-an-email', password: 'password123' },
          mockContext()
        )
      ).rejects.toThrow('Invalid email');
    });

    it('throws when password is too short', async () => {
      await expect(
        authResolvers.Mutation.register(
          {},
          { email: 'valid@test.com', password: 'short' },
          mockContext()
        )
      ).rejects.toThrow('at least 8 characters');
    });
  });

  describe('login', () => {
    it('returns token for valid credentials', async () => {
      const password = 'password123';
      const hashed = await hashPassword(password);

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: 'user@example.com',
        password: hashed,
        boards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await authResolvers.Mutation.login(
        {},
        { email: 'user@example.com', password },
        mockContext()
      );

      expect(result.token).toBeDefined();
      expect(result.user.email).toBe('user@example.com');
    });

    it('throws for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authResolvers.Mutation.login(
          {},
          { email: 'nobody@example.com', password: 'whatever' },
          mockContext()
        )
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws for wrong password', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-3',
        email: 'user@example.com',
        password: await hashPassword('correct-password'),
        boards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      await expect(
        authResolvers.Mutation.login(
          {},
          { email: 'user@example.com', password: 'wrong-password' },
          mockContext()
        )
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('me query', () => {
    it('returns null when not authenticated', async () => {
      const result = await authResolvers.Query.me({}, {}, mockContext(null));
      expect(result).toBeNull();
    });

    it('returns user when authenticated', async () => {
      const user = {
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed',
        boards: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaMock.user.findUnique.mockResolvedValue(user as any);

      const result = await authResolvers.Query.me(
        {},
        {},
        mockContext({ userId: 'user-1', email: 'user@example.com' })
      );

      expect(result?.email).toBe('user@example.com');
    });
  });
});

describe('JWT utilities', () => {
  it('returns null for invalid token', () => {
    expect(verifyToken('invalid-token')).toBeNull();
  });

  it('returns null for expired-looking garbage', () => {
    expect(verifyToken('eyJhbGciOiJIUzI1NiJ9.garbage.signature')).toBeNull();
  });
});
