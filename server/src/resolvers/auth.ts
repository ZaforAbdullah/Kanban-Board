import { GraphQLError } from 'graphql';
import { AuthContext } from '../middleware/auth';
import { hashPassword, comparePassword, validateEmail, validatePassword } from '../utils/password';
import { signToken } from '../utils/jwt';

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, { user, prisma }: AuthContext) => {
      if (!user) return null;
      return prisma.user.findUnique({
        where: { id: user.userId },
        include: { boards: { orderBy: { createdAt: 'asc' } } },
      });
    },
  },

  Mutation: {
    register: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      { prisma }: AuthContext
    ) => {
      // Validate inputs
      const normalizedEmail = email.trim().toLowerCase();
      if (!validateEmail(normalizedEmail)) {
        throw new GraphQLError('Invalid email address', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new GraphQLError(passwordError, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        throw new GraphQLError('An account with this email already exists', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashedPassword = await hashPassword(password);

      const newUser = await prisma.user.create({
        data: { email: normalizedEmail, password: hashedPassword },
        include: { boards: true },
      });

      const token = signToken({ userId: newUser.id, email: newUser.email });

      return { token, user: newUser };
    },

    login: async (
      _: unknown,
      { email, password }: { email: string; password: string },
      { prisma }: AuthContext
    ) => {
      const normalizedEmail = email.trim().toLowerCase();

      const foundUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { boards: { orderBy: { createdAt: 'asc' } } },
      });

      if (!foundUser) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const valid = await comparePassword(password, foundUser.password);
      if (!valid) {
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const token = signToken({ userId: foundUser.id, email: foundUser.email });

      return { token, user: foundUser };
    },
  },
};
