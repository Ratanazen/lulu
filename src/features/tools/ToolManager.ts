import { LuluTool, ToolResult } from './types';
import { memoryManager } from '../memory/MemoryManager';

export class CalculatorTool implements LuluTool {
  readonly id = 'calculator';
  readonly name = 'Calculator';
  readonly description = 'Safely evaluates basic arithmetic expressions (+, -, *, /, %, parenthesis).';
  readonly parameters = [
    { name: 'expression', type: 'string' as const, description: 'Math expression e.g. "25 * 4 + 10"', required: true },
  ];

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const expr = String(args.expression || '').trim();
    if (!expr) {
      return { success: false, displayMessage: 'Empty expression.', error: 'No expression provided' };
    }

    // Sanitize: allow only numbers, operators, parens, decimal
    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) {
      return { success: false, displayMessage: 'Invalid math expression characters.', error: 'Invalid characters' };
    }

    try {
      // Safe evaluation using Function
      const evaluated = new Function(`'use strict'; return (${expr})`)();
      return {
        success: true,
        result: evaluated,
        displayMessage: `${expr} = ${evaluated}`,
      };
    } catch (err: any) {
      return { success: false, displayMessage: `Calculation error: ${err.message}`, error: err.message };
    }
  }
}

export class TimerTool implements LuluTool {
  readonly id = 'timer';
  readonly name = 'Timer & Pomodoro';
  readonly description = 'Starts a timer or Pomodoro focus session.';
  readonly parameters = [
    { name: 'minutes', type: 'number' as const, description: 'Duration in minutes', required: true },
    { name: 'label', type: 'string' as const, description: 'Timer purpose / label', required: false },
  ];

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const mins = Math.max(1, Math.min(180, Number(args.minutes) || 25));
    const label = String(args.label || 'Focus Session');

    return {
      success: true,
      result: { minutes: mins, label, startedAt: Date.now() },
      displayMessage: `⏱️ Started a ${mins}-minute timer for "${label}". Stay focused!`,
    };
  }
}

export class NotesTool implements LuluTool {
  readonly id = 'notes';
  readonly name = 'Scratchpad Notes';
  readonly description = 'Saves a quick note or todo item into Lulu\'s persistent memory.';
  readonly parameters = [
    { name: 'title', type: 'string' as const, description: 'Title of the note', required: true },
    { name: 'content', type: 'string' as const, description: 'Note details / contents', required: true },
  ];

  async execute(args: Record<string, any>): Promise<ToolResult> {
    const title = String(args.title || 'Quick Note');
    const content = String(args.content || '');

    if (!content.trim()) {
      return { success: false, displayMessage: 'Note content cannot be empty.', error: 'Empty content' };
    }

    const item = memoryManager.remember(title, content, 'work', 4, true);
    return {
      success: true,
      result: item,
      displayMessage: `📝 Saved note "${title}" to persistent memory!`,
    };
  }
}

export class ToolManager {
  private tools = new Map<string, LuluTool>();

  constructor() {
    this.registerTool(new CalculatorTool());
    this.registerTool(new TimerTool());
    this.registerTool(new NotesTool());
  }

  registerTool(tool: LuluTool): void {
    this.tools.set(tool.id, tool);
  }

  getTool(id: string): LuluTool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): LuluTool[] {
    return Array.from(this.tools.values());
  }

  async execute(toolId: string, args: Record<string, any>): Promise<ToolResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return { success: false, displayMessage: `Tool "${toolId}" not found.`, error: 'Not found' };
    }

    try {
      return await tool.execute(args);
    } catch (err: any) {
      return { success: false, displayMessage: `Tool execution failed: ${err.message}`, error: err.message };
    }
  }
}

export const toolManager = new ToolManager();
