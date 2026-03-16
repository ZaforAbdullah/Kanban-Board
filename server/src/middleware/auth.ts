import { PrismaClient } from '@prisma/client';
import { extractBearerToken, verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthContext {
  user: JwtPayload | null;
  prisma: PrismaClient;
}

export function getUserFromAuthHeader(authHeader?: string): JwtPayload | null {
  const token = extractBearerToken(authHeader);
  if (!token) return null;
  return verifyToken(token);
}
