import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export interface ClaudeRemoteOptions {
  timeout?: number;
  retries?: number;
}

export interface ClaudeStreamEvent {
  type: 'chunk' | 'done' | 'error';
  content: string;
  timestamp: string;
}

const DEFAULT_TIMEOUT = env.AGENT_TIMEOUT || 120_000;
const DEFAULT_RETRIES = env.AGENT_RETRIES || 1;

export class ClaudeRemoteClient extends EventEmitter {
  private connected = false;
  private lastPing: string | null = null;

  getStatus() {
    return {
      connected: this.connected,
      lastPing: this.lastPing,
      mode: env.CLAUDE_REMOTE_URL ? 'remote' : 'cli',
    };
  }

  async ping(): Promise<boolean> {
    try {
      // Try to verify claude is accessible
      const result = await this.execClaude(['--version'], 5000);
      this.connected = result.length > 0;
      this.lastPing = new Date().toISOString();
      return this.connected;
    } catch {
      this.connected = false;
      return false;
    }
  }

  async *sendCommand(
    prompt: string,
    systemPrompt: string,
    options: ClaudeRemoteOptions = {}
  ): AsyncIterable<ClaudeStreamEvent> {
    const timeout = options.timeout || DEFAULT_TIMEOUT;
    const retries = options.retries ?? DEFAULT_RETRIES;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          logger.warn(`Retry attempt ${attempt} for Claude command`);
        }

        const startTime = Date.now();
        logger.info(`Sending command to Claude (attempt ${attempt + 1}), prompt length: ${prompt.length}`);

        let fullResponse = '';

        // Use Claude Code CLI in headless/print mode
        // Pass prompt via stdin to avoid CLI misinterpreting markdown (---) as flags
        const args = ['--print', '--no-session-persistence', '--setting-sources', '', '--allowedTools', '', '--system-prompt', systemPrompt, '-'];

        const cliProcess = this.spawnClaude(args, prompt);
        const chunks: string[] = [];

        yield* this.streamFromProcess(cliProcess, timeout, chunks);

        fullResponse = chunks.join('');
        const duration = Date.now() - startTime;

        logger.info(`Claude response received: ${fullResponse.length} chars in ${duration}ms`);

        this.connected = true;
        this.lastPing = new Date().toISOString();

        yield {
          type: 'done',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        };

        return; // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`Claude command failed (attempt ${attempt + 1}): ${lastError.message}`);

        if (attempt < retries) {
          // Wait before retry
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }

    this.connected = false;
    yield {
      type: 'error',
      content: lastError?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }

  private spawnClaude(args: string[], stdinData?: string): ChildProcess {
    const command = env.CLAUDE_REMOTE_URL
      ? 'curl' // Placeholder for remote API
      : 'claude';

    const spawnEnv = { ...process.env };
    delete spawnEnv.CLAUDECODE;
    delete spawnEnv.CLAUDE_CODE_SESSION;
    delete spawnEnv.CLAUDE_CODE_ENTRYPOINT;

    const proc = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: '/tmp',
      env: spawnEnv,
    });

    // Write prompt via stdin then close, so CLI reads from stdin instead of args
    if (stdinData) {
      proc.stdin?.write(stdinData);
    }
    proc.stdin?.end();

    return proc;
  }

  private async *streamFromProcess(
    proc: ChildProcess,
    timeout: number,
    chunks: string[]
  ): AsyncIterable<ClaudeStreamEvent> {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      controller.abort();
    }, timeout);

    try {
      if (!proc.stdout) throw new Error('No stdout on process');

      // Collect stderr in parallel so it's available on error
      const stderrChunks: Buffer[] = [];
      proc.stderr?.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk)));

      for await (const data of proc.stdout) {
        const text = data.toString();
        chunks.push(text);
        yield {
          type: 'chunk',
          content: text,
          timestamp: new Date().toISOString(),
        };
      }

      // Check exit code
      const exitCode = await new Promise<number>((resolve) => {
        if (proc.exitCode !== null) {
          resolve(proc.exitCode);
        } else {
          proc.on('close', (code) => resolve(code ?? 1));
        }
      });

      if (exitCode !== 0) {
        const stderr = Buffer.concat(stderrChunks).toString();
        logger.error(`Claude stderr: ${stderr}`);
        throw new Error(`Claude exited with code ${exitCode}: ${stderr}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  private async readStream(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString();
  }

  private execClaude(args: string[], timeout: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const execEnv = { ...process.env };
      delete execEnv.CLAUDECODE;
      delete execEnv.CLAUDE_CODE_SESSION;
      delete execEnv.CLAUDE_CODE_ENTRYPOINT;

      const proc = spawn('claude', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: execEnv,
      });
      let output = '';
      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('Timeout'));
      }, timeout);

      proc.stdout?.on('data', (d) => (output += d.toString()));
      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) resolve(output);
        else reject(new Error(`Exit code ${code}`));
      });
      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
}

// Singleton
export const claudeRemote = new ClaudeRemoteClient();
