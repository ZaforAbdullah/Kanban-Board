import { authResolvers } from './auth';
import { boardResolvers } from './board';
import { taskResolvers } from './task';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...boardResolvers.Query,
    ...taskResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...boardResolvers.Mutation,
    ...taskResolvers.Mutation,
  },
};
