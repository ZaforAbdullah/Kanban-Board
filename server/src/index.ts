import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers/index';
import { prisma } from './prisma';
import { getUserFromAuthHeader } from './middleware/auth';

const PORT = process.env.PORT || 4000;

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    formatError: (formattedError) => {
      // In production, hide internal server error details
      if (
        process.env.NODE_ENV === 'production' &&
        formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR'
      ) {
        return { message: 'Internal server error', extensions: { code: 'INTERNAL_SERVER_ERROR' } };
      }
      return formattedError;
    },
  });

  await server.start();

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: corsOrigin,
      credentials: true,
    }),
    bodyParser.json({ limit: '10mb' }),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: getUserFromAuthHeader(req.headers.authorization),
        prisma,
      }),
    })
  );

  // Health-check endpoint for Docker
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

  console.log(`Server running at http://localhost:${PORT}/graphql`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
