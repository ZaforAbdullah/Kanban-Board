import { gql } from '@apollo/client';
import { BOARD_FIELDS } from './queries';

export const REGISTER = gql`
  mutation Register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
      token
      user {
        id
        email
        createdAt
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        createdAt
      }
    }
  }
`;

export const CREATE_BOARD = gql`
  ${BOARD_FIELDS}
  mutation CreateBoard($name: String!, $columns: [ColumnInput!]) {
    createBoard(name: $name, columns: $columns) {
      ...BoardFields
    }
  }
`;

export const UPDATE_BOARD = gql`
  ${BOARD_FIELDS}
  mutation UpdateBoard($id: ID!, $name: String!, $columns: [ColumnInput!]) {
    updateBoard(id: $id, name: $name, columns: $columns) {
      ...BoardFields
    }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBoard($id: ID!) {
    deleteBoard(id: $id)
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask(
    $title: String!
    $description: String
    $columnId: ID!
    $subtasks: [SubtaskInput!]
  ) {
    createTask(
      title: $title
      description: $description
      columnId: $columnId
      subtasks: $subtasks
    ) {
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
`;

export const UPDATE_TASK = gql`
  mutation UpdateTask(
    $id: ID!
    $title: String!
    $description: String
    $columnId: ID!
    $subtasks: [SubtaskInput!]
  ) {
    updateTask(
      id: $id
      title: $title
      description: $description
      columnId: $columnId
      subtasks: $subtasks
    ) {
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
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

export const MOVE_TASK = gql`
  mutation MoveTask($id: ID!, $columnId: ID!, $order: Int!) {
    moveTask(id: $id, columnId: $columnId, order: $order) {
      id
      columnId
      order
    }
  }
`;

export const TOGGLE_SUBTASK = gql`
  mutation ToggleSubtask($id: ID!) {
    toggleSubtask(id: $id) {
      id
      isCompleted
      taskId
    }
  }
`;
