/**
 * Message types for communication between VS Code extension and webview
 */

export type MessageType =
  | 'initialize'
  | 'getState'
  | 'updateState'
  | 'executeCommand'
  | 'error';

export interface BaseMessage {
  type: MessageType;
}

export interface InitializeMessage extends BaseMessage {
  type: 'initialize';
}

export interface GetStateMessage extends BaseMessage {
  type: 'getState';
}

export interface UpdateStateMessage extends BaseMessage {
  type: 'updateState';
  state: unknown;
}

export interface ExecuteCommandMessage extends BaseMessage {
  type: 'executeCommand';
  command: string;
  args?: unknown[];
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  error: string;
}

export type Message =
  | InitializeMessage
  | GetStateMessage
  | UpdateStateMessage
  | ExecuteCommandMessage
  | ErrorMessage;

export interface ResponseMessage {
  id: string;
  success: boolean;
  data?: unknown;
  error?: string;
}
