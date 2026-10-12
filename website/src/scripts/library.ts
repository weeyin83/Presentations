import { matchesPresentation } from '../lib/search.mjs';

interface Presentation { id: string; title: string; description: string; topics: string[]; event: string | null; year: number; folder: string; date: string | null; }
const form = document.querySelector<HTMLFormElement>('#library-filters')!;
const search = document.querySelector<HTMLInputElement>('#search')!;
const year = document.querySelector<HTMLSelectElement>('#year')!;
const event = document.querySelector<HTMLSelectElement>('#event')!;
const sort = document.querySelector<HTMLSelectElement>('#sort')!;
const grid = document.querySelector<HTMLDivElement>('#presentation-grid')!;
const cards = new Map([...grid.querySelectorAll<HTMLElement>('[data-id]')].map((card) => [card.dataset.id, card]));
const presentations: Presentation[] = JSON.parse(document.querySelector('#presentation-index')!.textContent!);
const count = document.querySelector('#result-count')!;
const reset = document.querySelector<HTMLButtonElement>('#reset-filters')!;
const clear = document.querySelector<HTMLButtonElement>('#clear-search')!;
const empty = document.querySelector<HTMLDivElement>('#empty-state')!;
const topicPanel = document.querySelector<HTMLDetailsElement>('#topic-panel')!;
if (window.matchMedia('(max-width: 900px)').matches) topicPanel.open = false;

function applyUrl() {
  const params = new URLSearchParams(window.location.search);
  search.value = params.get('q') || '';
  year.value = params.get('year') || '';
  event.value = params.get('event') || '';
  sort.value = params.get('sort') || 'newest';
  if (!sort.value) sort.value = 'newest';
  const topic = params.get('topic') || '';
  const radios = [...form.querySelectorAll<HTMLInputElement>('input[name="topic"]')];
  const match = radios.find((radio) => radio.value === topic) || radios[0];
  match.checked = true;
}

function update(syncUrl = true) {
  const topic = form.querySelector<HTMLInputElement>('input[name="topic"]:checked')!.value;
  const state = { query: search.value, topic, year: year.value, event: event.value };
  const ordered = [...presentations].sort((first, second) => {
    if (sort.value === 'title') return first.title.localeCompare(second.title);
    const newest = second.year - first.year || (second.date || '').localeCompare(first.date || '') || first.title.localeCompare(second.title);
    return sort.value === 'oldest' ? -newest : newest;
  });
  let visible = 0;
  for (const presentation of ordered) {
    const card = cards.get(presentation.id)!;
    card.hidden = !matchesPresentation(presentation, state);
    if (!card.hidden) visible++;
    grid.append(card);
  }
  count.textContent = `${visible} ${visible === 1 ? 'presentation' : 'presentations'}${visible !== presentations.length ? ` of ${presentations.length}` : ''}`;
  empty.hidden = visible !== 0;
  grid.hidden = visible === 0;
  reset.hidden = !search.value && !topic && !year.value && !event.value && sort.value === 'newest';
  clear.hidden = !search.value;
  if (syncUrl) {
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('q', search.value.trim());
    if (topic) params.set('topic', topic);
    if (year.value) params.set('year', year.value);
    if (event.value) params.set('event', event.value);
    if (sort.value !== 'newest') params.set('sort', sort.value);
    const query = params.toString();
    history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
  }
}

form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('input', () => update());
form.addEventListener('change', () => update());
form.addEventListener('reset', () => { setTimeout(() => { update(); search.focus(); }, 0); });
clear.addEventListener('click', () => { search.value = ''; update(); search.focus(); });
window.addEventListener('popstate', () => { applyUrl(); update(false); });
applyUrl();
update(false);