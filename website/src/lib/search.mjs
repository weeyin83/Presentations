export function matchesPresentation(presentation, { query = '', topic = '', year = '', event = '' } = {}) {
  const haystack = `${presentation.title} ${presentation.description} ${presentation.topics.join(' ')} ${presentation.event || ''} ${presentation.year} ${presentation.folder} ${presentation.searchText || ''}`.toLowerCase();
  return query.toLowerCase().trim().split(/\s+/).every((word) => haystack.includes(word)) && (!topic || presentation.topics.includes(topic)) && (!year || String(presentation.year) === year) && (!event || presentation.event === event);
}