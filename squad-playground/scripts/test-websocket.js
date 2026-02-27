#!/usr/bin/env node

const AGENTS = [
  'master', 'pesquisa', 'organizador', 'solucoes',
  'estruturas', 'financeiro', 'closer', 'apresentacao',
];

const BASE_URL = 'http://127.0.0.1:3000';

async function sendUpdate(agent, status, message) {
  const res = await fetch(`${BASE_URL}/api/mock/agent-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent, status, message }),
  });
  const data = await res.json();
  console.log(`  → ${agent} [${status}]: ${message} (broadcasted: ${data.broadcasted})`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting WebSocket test sequence...\n');

  for (const agent of AGENTS) {
    console.log(`▶ Agent: ${agent}`);
    await sendUpdate(agent, 'processing', `${agent} is working...`);
    await sleep(2000);
    await sendUpdate(agent, 'done', `${agent} completed!`);
    await sleep(500);
    console.log('');
  }

  console.log('✅ All 8 agents updated successfully!');
}

main().catch(console.error);
