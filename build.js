const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'template.html');
const rawText = fs.readFileSync(templatePath, 'utf8');

const DATA_MARKER = '@@CTTI_TASKS' + '_STATE@@';
const BODY_MARKER = '@@CTTI_TASKS' + '_TEMPLATE@@';

function countOccurrences(str, marker) {
  return str.split(marker).length - 1;
}

const dataCount = countOccurrences(rawText, DATA_MARKER);
const bodyCount = countOccurrences(rawText, BODY_MARKER);
if (dataCount !== 1) throw new Error('DATA_MARKER occurs ' + dataCount + ' times, expected 1');
if (bodyCount !== 1) throw new Error('BODY_MARKER occurs ' + bodyCount + ' times, expected 1');
console.log('Marker sanity check passed: DATA_MARKER x1, BODY_MARKER x1');

function splitJoin(str, marker, value) {
  return str.split(marker).join(value);
}
function escapeForEmbed(s) {
  return s.replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
function fillTemplate(tmpl, state) {
  const json = escapeForEmbed(JSON.stringify(state));
  const withData = splitJoin(tmpl, DATA_MARKER, json);
  const literal = escapeForEmbed(JSON.stringify(tmpl));
  const withTemplate = splitJoin(withData, BODY_MARKER, 'const BODY_TEMPLATE = ' + literal + ';');
  return withTemplate;
}

const initialState = {
  groups: [
    { id: 'g-prisma', name: 'Programa PRISMA', tasks: [] },
    { id: 'g-atlas', name: 'Programa ATLAS', tasks: [] },
    { id: 'g-atlasx', name: 'Producte ATLAS X', tasks: [] },
    { id: 'g-ea', name: 'EA al CTTI', tasks: [] },
    { id: 'g-me', name: 'Me', tasks: [] }
  ],
  history: [],
  settings: { viewMode: 'cards' },
  lastResolvedId: null
};

const filledFull = fillTemplate(rawText, initialState);

// --- Verification 1: filledFull must be a well-formed full document ---
if (!/^<!doctype html>/i.test(filledFull)) throw new Error('filledFull does not start with doctype');

// --- Verification 2: extract the app <script> (last script tag, not the JSON one) and check JS syntax ---
const scriptMatches = [...filledFull.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
if (scriptMatches.length !== 2) throw new Error('Expected exactly 2 <script> tags, found ' + scriptMatches.length);
const appScript = scriptMatches[1][2];
try {
  new Function(appScript);
  console.log('JS syntax check passed for app script (' + appScript.length + ' chars)');
} catch (e) {
  console.error('SYNTAX ERROR in app script:', e.message);
  throw e;
}

// --- Verification 3: BODY_TEMPLATE self-consistency (quine check) ---
const constMatch = appScript.match(/const BODY_TEMPLATE = ("(?:[^"\\]|\\.)*");/);
if (!constMatch) throw new Error('Could not find BODY_TEMPLATE const declaration in app script');
const decoded = new Function('return ' + constMatch[1])();
if (decoded !== rawText) {
  // find first diff index for debugging
  let i = 0;
  while (i < decoded.length && i < rawText.length && decoded[i] === rawText[i]) i++;
  console.error('Mismatch at index', i);
  console.error('decoded around:', JSON.stringify(decoded.slice(Math.max(0,i-40), i+40)));
  console.error('rawText  around:', JSON.stringify(rawText.slice(Math.max(0,i-40), i+40)));
  throw new Error('BODY_TEMPLATE does not round-trip to the original template (quine check failed)');
}
console.log('Quine self-consistency check passed: BODY_TEMPLATE === original template.html');

// --- Verification 4: simulate one more save cycle (rebuild from BODY_TEMPLATE with new state) ---
const secondState = JSON.parse(JSON.stringify(initialState));
secondState.groups[0].tasks.push({ id: 't-test1', title: 'Prova amb <angle> & "cometes"', description: 'Línia 1\nLínia 2', deadline: '2026-09-05', createdAt: new Date().toISOString() });
const secondFull = fillTemplate(decoded, secondState);
const scriptMatches2 = [...secondFull.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
const appScript2 = scriptMatches2[1][2];
new Function(appScript2); // syntax check again
const dataScript2 = scriptMatches2[0][2];
const parsedBack = JSON.parse(dataScript2);
if (parsedBack.groups[0].tasks[0].title !== 'Prova amb <angle> & "cometes"') {
  throw new Error('Round-trip of task title with special characters failed: ' + JSON.stringify(parsedBack.groups[0].tasks[0].title));
}
console.log('Second-generation save cycle check passed (special characters survive round-trip).');

// --- Build the fragment for the Artifact tool's initial publish (strip outer doctype/html/head/body wrapper tags) ---
let fragment = filledFull
  .replace(/^\s*<!doctype[^>]*>\s*/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<\/html>\s*$/i, '')
  .replace(/<head[^>]*>/i, '')
  .replace(/<\/head>/i, '')
  .replace(/<body[^>]*>/i, '')
  .replace(/<\/body>/i, '');

fs.writeFileSync(path.join(__dirname, 'initial.html'), fragment, 'utf8');
console.log('Wrote initial.html (' + fragment.length + ' chars)');

// --- Standalone full document, for hosting outside claude.ai (e.g. GitHub Pages) ---
// Same content as filledFull; the page falls back to localStorage persistence there
// since window.claude does not exist on a plain static host.
fs.writeFileSync(path.join(__dirname, 'index.html'), filledFull, 'utf8');
console.log('Wrote index.html (' + filledFull.length + ' chars) for standalone hosting');

console.log('All checks passed.');
