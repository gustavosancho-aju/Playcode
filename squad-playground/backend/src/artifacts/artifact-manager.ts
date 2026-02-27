import { mkdir, writeFile, readFile, readdir, stat } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { existsSync } from 'fs';
import { logger } from '../utils/logger';
import type { AgentId, PipelineState, ArtifactIndex } from 'shared/types';

const ARTIFACTS_DIR = join(__dirname, '..', '..', '..', 'docs', 'artifacts');

function sanitizeFilename(filename: string): string {
  // Strip path separators and resolve to basename only
  const safe = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '');
  if (!safe || safe.startsWith('.')) {
    throw new Error(`Invalid filename: ${filename}`);
  }
  return safe;
}

function sanitizeSessionId(sessionId: string): string {
  const safe = sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) throw new Error(`Invalid sessionId: ${sessionId}`);
  return safe;
}

export class ArtifactManager {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || ARTIFACTS_DIR;
  }

  private sessionPath(sessionId: string): string {
    return join(this.baseDir, sanitizeSessionId(sessionId));
  }

  async ensureSessionDir(sessionId: string): Promise<string> {
    const dir = this.sessionPath(sessionId);
    await mkdir(dir, { recursive: true });
    return dir;
  }

  async saveArtifact(
    sessionId: string,
    agentId: AgentId,
    filename: string,
    content: string
  ): Promise<string> {
    const safeFilename = sanitizeFilename(filename);
    const dir = await this.ensureSessionDir(sessionId);
    const filePath = join(dir, safeFilename);

    // Add YAML frontmatter
    const frontmatter = [
      '---',
      `agent: ${agentId}`,
      `sessionId: ${sessionId}`,
      `createdAt: ${new Date().toISOString()}`,
      `status: completed`,
      '---',
      '',
    ].join('\n');

    const fullContent = content.startsWith('---') ? content : frontmatter + content;
    await writeFile(filePath, fullContent, 'utf-8');

    // Update index
    await this.updateIndex(sessionId);

    logger.info(`Artifact saved: ${filePath}`);
    return filePath;
  }

  async saveState(sessionId: string, state: PipelineState): Promise<void> {
    const dir = await this.ensureSessionDir(sessionId);
    const filePath = join(dir, 'pipeline-state.json');
    await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  async getState(sessionId: string): Promise<PipelineState | null> {
    const filePath = join(this.sessionPath(sessionId), 'pipeline-state.json');
    if (!existsSync(filePath)) return null;

    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  }

  async listArtifacts(sessionId: string): Promise<ArtifactIndex[]> {
    const dir = this.sessionPath(sessionId);
    const indexPath = join(dir, 'index.json');

    if (!existsSync(indexPath)) {
      return this.updateIndex(sessionId);
    }

    const raw = await readFile(indexPath, 'utf-8');
    return JSON.parse(raw);
  }

  async getArtifact(sessionId: string, filename: string): Promise<string | null> {
    const safeFilename = sanitizeFilename(filename);
    const filePath = join(this.sessionPath(sessionId), safeFilename);
    if (!existsSync(filePath)) return null;
    return readFile(filePath, 'utf-8');
  }

  private async updateIndex(sessionId: string): Promise<ArtifactIndex[]> {
    const dir = this.sessionPath(sessionId);
    if (!existsSync(dir)) return [];

    const files = await readdir(dir);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const index: ArtifactIndex[] = [];
    for (const filename of mdFiles) {
      const filePath = join(dir, filename);
      const stats = await stat(filePath);
      const content = await readFile(filePath, 'utf-8');

      // Extract agent from frontmatter
      const agentMatch = content.match(/^agent:\s*(\w+)/m);
      const agent = (agentMatch?.[1] || 'unknown') as AgentId;

      index.push({
        filename,
        agent,
        createdAt: stats.mtime.toISOString(),
        size: stats.size,
      });
    }

    // Save index
    const indexPath = join(dir, 'index.json');
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');

    return index;
  }
}

// Singleton
export const artifactManager = new ArtifactManager();
