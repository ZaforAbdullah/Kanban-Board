export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    boards: [Board!]!
    createdAt: String!
  }

  type Board {
    id: ID!
    name: String!
    columns: [Column!]!
    createdAt: String!
    updatedAt: String!
  }

  type Column {
    id: ID!
    name: String!
    color: String!
    order: Int!
    tasks: [Task!]!
  }

  type Task {
    id: ID!
    title: String!
    description: String
    order: Int!
    columnId: String!
    column: Column!
    subtasks: [Subtask!]!
    createdAt: String!
    updatedAt: String!
  }

  type Subtask {
    id: ID!
    title: String!
    isCompleted: Boolean!
    taskId: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input ColumnInput {
    id: ID
    name: String!
    color: String
  }

  input SubtaskInput {
    id: ID
    title: String!
    isCompleted: Boolean
  }

  type Query {
    me: User
    boards: [Board!]!
    board(id: ID!): Board
    task(id: ID!): Task
  }

  type Mutation {
    # Auth
    register(email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!

    # Boards
    createBoard(name: String!, columns: [ColumnInput!]): Board!
    updateBoard(id: ID!, name: String!, columns: [ColumnInput!]): Board!
    deleteBoard(id: ID!): Boolean!

    # Tasks
    createTask(
      title: String!
      description: String
      columnId: ID!
      subtasks: [SubtaskInput!]
    ): Task!
    updateTask(
      id: ID!
      title: String!
      description: String
      columnId: ID!
      subtasks: [SubtaskInput!]
    ): Task!
    deleteTask(id: ID!): Boolean!
    moveTask(id: ID!, columnId: ID!, order: Int!): Task!

    # Subtasks
    toggleSubtask(id: ID!): Subtask!
  }
`;
