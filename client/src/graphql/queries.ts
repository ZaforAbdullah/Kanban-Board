import { gql } from '@apollo/client';

export const BOARD_FIELDS = gql`
  fragment BoardFields on Board {
    id
    name
    createdAt
    updatedAt
    columns {
      id
      name
      color
      order
      tasks {
        id
        title
        description
        order
        columnId
        subtasks {
          id
          title
          isCompleted
          taskId
        }
      }
    }
  }
`;

export const GET_BOARDS = gql`
  ${BOARD_FIELDS}
  query GetBoards {
    boards {
      ...BoardFields
    }
  }
`;

export const GET_BOARD = gql`
  ${BOARD_FIELDS}
  query GetBoard($id: ID!) {
    board(id: $id) {
      ...BoardFields
    }
  }
`;

export const GET_TASK = gql`
  query GetTask($id: ID!) {
    task(id: $id) {
      id
      title
      description
      order
      columnId
      column {
        id
        name
        color
      }
      subtasks {
        id
        title
        isCompleted
        taskId
      }
      createdAt
      updatedAt
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      email
      createdAt
    }
  }
`;
