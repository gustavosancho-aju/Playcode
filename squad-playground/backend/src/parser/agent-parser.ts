import { logger } from '../utils/logger';
import type { ParsedAgentMessage, Task, AgentId, AgentStatus } from 'shared/types';

const AGENT_REGEX = /\[AGENT:(\w+)\]\[STATUS:(\w+)\]/;
const TASKS_REGEX = /\[TASKS\]([\s\S]*?)\[\/TASKS\]/;
const OUTPUT_REGEX = /\[OUTPUT:([^\]]+)\]([\s\S]*?)\[\/OUTPUT\]/;
const HANDOFF_REGEX = /\[HANDOFF:(\w+)\]([\s\S]*?)\[\/HANDOFF\]/;
const TASK_LINE_REGEX = /^-\s*\[([ x~])\]\s*(.+)$/gm;

const STATUS_MAP: Record<string, Task['status']> = {
  'x': 'completed',
  '~': 'in_progress',
  ' ': 'pending',
};

function extractMessage(raw: string): string {
  let msg = raw;
  // Remove known tags to extract the message content
  msg = msg.replace(AGENT_REGEX, '');
  msg = msg.replace(TASKS_REGEX, '');
  msg = msg.replace(OUTPUT_REGEX, '');
  msg = msg.replace(HANDOFF_REGEX, '');
  return msg.trim();
}

function parseTasks(raw: string): Task[] {
  const tasksMatch = TASKS_REGEX.exec(raw);
  if (!tasksMatch) return [];

  const tasks: Task[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(TASK_LINE_REGEX.source, TASK_LINE_REGEX.flags);

  while ((match = regex.exec(tasksMatch[1])) !== null) {
    tasks.push({
      text: match[2].trim(),
      status: STATUS_MAP[match[1]] || 'pending',
    });
  }

  return tasks;
}

export function parseAgentOutput(raw: string): ParsedAgentMessage {
  if (!raw || raw.trim() === '') {
    logger.warn('Parser received empty input');
    return {
      agent: 'unknown',
      status: 'idle',
      message: '',
      tasks: [],
      output: null,
      handoff: null,
    };
  }

  const agentMatch = AGENT_REGEX.exec(raw);

  if (!agentMatch) {
    logger.warn('No [AGENT:] tag found in input, using fallback mode');
    return {
      agent: 'unknown',
      status: 'idle',
      message: raw.trim(),
      tasks: [],
      output: null,
      handoff: null,
    };
  }

  const agent = agentMatch[1].toLowerCase() as AgentId | 'unknown';
  const status = agentMatch[2].toLowerCase() as AgentStatus;

  const tasks = parseTasks(raw);

  const outputMatch = OUTPUT_REGEX.exec(raw);
  const output = outputMatch
    ? { filename: outputMatch[1], content: outputMatch[2].trim() }
    : null;

  const handoffMatch = HANDOFF_REGEX.exec(raw);
  const handoff = handoffMatch
    ? (handoffMatch[1].toLowerCase() as AgentId)
    : null;

  const message = extractMessage(raw);

  return { agent, status, message, tasks, output, handoff };
}
