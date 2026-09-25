// Tools Subsystem Types

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  required: boolean;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  displayMessage: string;
  error?: string;
}

export interface LuluTool {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly parameters: ToolParameter[];
  readonly requiresConfirmation?: boolean;

  execute(args: Record<string, any>): Promise<ToolResult>;
}
