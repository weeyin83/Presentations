import { loadCatalog } from '../src/lib/catalog.mjs';

try {
  const { presentations, warnings } = loadCatalog();
  console.log(`Validated ${presentations.length} presentations and ${presentations.reduce((count, talk) => count + talk.downloads.length, 0)} downloads.`);
  for (const warning of warnings) console.warn(`Content note: ${warning}`);
} catch (error) {
  console.error(`Content validation failed: ${error.message}`);
  process.exitCode = 1;
}