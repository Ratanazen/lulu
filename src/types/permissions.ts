export type PermissionLevel =
  | 'READ_ONLY'
  | 'SAFE_EDIT'
  | 'FULL_EDIT'
  | 'COMMAND_CONFIRM'
  | 'AUTONOMOUS';

export type PermissionAction =
  | 'ALLOW_ONCE'
  | 'ALLOW_FOR_TASK'
  | 'ALLOW_FOR_PROJECT'
  | 'DENY';

export interface PermissionRequest {
  id: string;
  toolName: string;
  target: string;
  description: string;
  isDangerous?: boolean;
}
