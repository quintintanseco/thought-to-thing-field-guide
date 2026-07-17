const modes = [
  { accent: 'lime', kicker: 'From blank folder to working product', title: 'I turn an idea into something you can click.', copy: 'Websites, internal tools, prototypes, data views, and the less glamorous plumbing that makes them real.', prompt: 'Build a calm, premium booking dashboard for a small hotel.', output: ['Responsive interface', 'Real interactions', 'Tested, runnable code'] },
  { accent: 'blue', kicker: 'Signal, extracted', title: 'I find the shape hiding inside the noise.', copy: 'Give me a codebase, a pile of notes, a spreadsheet, or a difficult question. I will trace it, test it, and explain what matters.', prompt: 'Find why checkout conversion fell and show me the evidence.', output: ['Root-cause analysis', 'Clear visual summary', 'Prioritized next moves'] },
  { accent: 'orange', kicker: 'Busywork, retired', title: 'I make repeatable work happen by itself.', copy: 'Recurring reports, inbox triage, data cleanup, monitoring, reminders, and multi-step workflows—designed with sensible guardrails.', prompt: 'Every Friday, turn this week’s activity into a concise brief.', output: ['Reliable workflow', 'Human checkpoints', 'Useful exceptions only'] },
  { accent: 'pink', kicker: 'A creative partner with working hands', title: 'I help the first draft become the right draft.', copy: 'Words, images, documents, presentations, plans, and polished experiences—built through iteration, not dropped at your feet.', prompt: 'Turn this rough idea into a story people remember.', output: ['Distinct direction', 'Polished artifact', 'Fast iterations'] }
];

const shell = document.querySelector('.site-shell');
window.addEventListener('pointermove', (event) => {
  const x = event.clientX / innerWidth;
  const y = event.clientY / innerHeight;
  shell.style.setProperty('--mx', `${x * 100}%`);
  shell.style.setProperty('--my', `${y * 100}%`);
  shell.style.setProperty('--rx', `${(0.5 - y) * 12}deg`);
  shell.style.setProperty('--ry', `${(x - 0.5) * 16}deg`);
}, { passive: true });

function showMode(index) {
  const mode = modes[index];
  const card = document.querySelector('.mode-card');
  card.className = `mode-card accent-${mode.accent}`;
  document.querySelector('#mode-kicker').textContent = mode.kicker;
  document.querySelector('#mode-title').textContent = mode.title;
  document.querySelector('#mode-copy').textContent = mode.copy;
  document.querySelector('#mode-prompt').textContent = mode.prompt;
  document.querySelector('#mode-output').innerHTML = mode.output.map((item, i) => `<p><i>${String(i + 1).padStart(2, '0')}</i>${item}<b>✓</b></p>`).join('');
  document.querySelectorAll('.mode-tabs button').forEach((button, i) => {
    const active = i === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', active);
    button.querySelector('i').textContent = active ? '↗' : '→';
  });
}

document.querySelectorAll('.mode-tabs button').forEach(button => button.addEventListener('click', () => showMode(Number(button.dataset.mode))));
showMode(0);

const idea = document.querySelector('#idea');
const result = document.querySelector('#concept-result');
document.querySelectorAll('.suggestions button').forEach(button => button.addEventListener('click', () => {
  idea.value = button.textContent;
  result.hidden = true;
  idea.focus();
}));

document.querySelector('#idea-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const prompt = idea.value.trim();
  if (!prompt) return;
  const started = performance.now();
  result.hidden = false;
  result.className = 'concept-result thinking';
  result.innerHTML = '<span class="scan-line"></span><p>Finding the leverage point…</p>';
  setTimeout(() => {
    const elapsed = ((performance.now() - started) / 1000).toFixed(1);
    result.className = 'concept-result done';
    result.innerHTML = `<div class="result-head"><span>FIRST MOVE</span><b>Mapped in ${elapsed}s</b></div><h3>Turn “${prompt.replace(/[<>&]/g, '')}” into a concrete first version.</h3><div class="result-steps"><span>01 <b>Frame the outcome</b></span><span>02 <b>Build the smallest proof</b></span><span>03 <b>Test what matters</b></span></div><p class="result-note">This is a local demo. In a real task, I would inspect your materials, make the artifact, and verify the result.</p>`;
  }, 850);
});
