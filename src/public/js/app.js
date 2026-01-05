// AgentScaffold - Single file UI
const $ = id => document.getElementById(id);

let sessionId = null;

async function createAgent(description) {
  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: description, sessionId })
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (line.trim()) {
        try {
          const chunk = JSON.parse(line);
          if (chunk.type === 'text' || chunk.type === 'result') {
            $('content').textContent += chunk.text;
          } else if (chunk.type === 'tool') {
            $('statusText').textContent = `Using ${chunk.name}...`;
          } else if (chunk.type === 'usage') {
            const tokens = chunk.input + chunk.output;
            const cost = (chunk.input * 0.25 + chunk.output * 1.25) / 1e6;
            $('tokens').textContent = tokens;
            $('cost').textContent = cost.toFixed(4);
          } else if (chunk.type === 'done') {
            $('status').classList.remove('visible');
            $('btn').disabled = false;
            $('btn').textContent = 'Create';
          }
        } catch {}
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = $('form');
  const input = $('input');
  const btn = $('btn');

  // Random example
  const examples = [
    "Create a recipe finder agent that searches AllRecipes",
    "Build a code review agent that analyzes GitHub PRs",
    "Make a research assistant that summarizes ArXiv papers",
    "Create a job search agent for remote engineering positions"
  ];
  input.value = examples[Math.floor(Math.random() * examples.length)];

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const desc = input.value.trim();
    if (!desc) return;

    btn.disabled = true;
    btn.textContent = 'Creating...';
    $('content').textContent = '';
    $('status').classList.add('visible');
    $('statusText').textContent = 'Creating agent...';
    $('results').classList.add('visible');

    await createAgent(desc);
  });
});
