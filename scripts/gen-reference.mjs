/**
 * Regenerates src/data/reference.generated.json from a real unflick binary:
 * the CLI from `--help` output, the MCP surface from a live `tools/list` and
 * `resources/list`. Run it after every unflick release so the docs page
 * lists what the player actually answers with, not what someone remembered.
 *
 *   node scripts/gen-reference.mjs [path/to/unflick]
 *
 * Defaults to the macOS app bundle, then `unflick` on PATH.
 */

import { execFileSync, spawn } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'reference.generated.json');
const MAC_BUNDLE = '/Applications/unflick.app/Contents/MacOS/unflick';
const BIN = process.argv[2] ?? (existsSync(MAC_BUNDLE) ? MAC_BUNDLE : 'unflick');

// Options every subcommand inherits; listing them on each row is noise.
const GLOBAL_OPTS = new Set(['--allow-dev', '--help', '--version']);

function help(args) {
  return execFileSync(BIN, [...args, '-h'], { encoding: 'utf8' });
}

/** Split clap's short help into its about line, usage, subcommands and options. */
function parseHelp(text) {
  const lines = text.split('\n');
  const about = lines[0].trim();
  const usage = (lines.find((l) => l.startsWith('Usage: ')) ?? '').slice('Usage: '.length).trim();
  const section = (name) => {
    const start = lines.indexOf(`${name}:`);
    if (start < 0) return [];
    const out = [];
    for (let i = start + 1; i < lines.length && lines[i].startsWith(' '); i++) out.push(lines[i]);
    return out;
  };
  const commands = section('Commands')
    .map((l) => l.match(/^\s{2}(\S+)\s+(.*)$/))
    .filter((m) => m && m[1] !== 'help')
    .map((m) => ({ name: m[1], about: m[2].trim() }));
  const options = section('Options')
    .map((l) => l.match(/^\s+(?:-\w,\s+)?(--[\w-]+)(?:\s+(<[^>]+>))?/))
    .filter((m) => m && !GLOBAL_OPTS.has(m[1]))
    .map((m) => (m[2] ? `${m[1]} ${m[2]}` : m[1]));
  return { about, usage, commands, options };
}

function signature(h) {
  const opts = h.options.map((o) => `[${o}]`).join(' ');
  return h.usage.replace(/\s*\[OPTIONS\]/, opts ? ` ${opts}` : '').replace(/\s+/g, ' ');
}

/** Walk a command and its subcommands; leaves become reference rows. */
function walk(path, about) {
  const h = parseHelp(help(path));
  if (h.commands.length === 0) {
    return [{ name: path.join(' '), signature: signature(h), summary: about ?? h.about }];
  }
  return h.commands.flatMap((c) => walk([...path, c.name], c.about));
}

// Headings for the docs page. A command the player grows later that isn't
// listed here still shows up, under "More".
const GROUPS = [
  ['Playback', ['play', 'pause', 'resume', 'stop', 'seek', 'volume', 'speed', 'status', 'chapter', 'loop', 'frame', 'bookmark', 'session', 'recent', 'incognito']],
  ['Media tools', ['info', 'screenshot', 'clip', 'transcript', 'nowplaying']],
  ['Subtitles & audio', ['subtitle', 'audio']],
  ['Picture & window', ['video', 'filter', 'window']],
  ['Playlist & library', ['playlist', 'library']],
  ['Streams, discs & casting', ['sponsor', 'disc', 'cast']],
  ['Input', ['keybind', 'mouse']],
  ['Settings', ['settings']],
  ['Daemon & diagnostics', ['daemon', 'shutdown', 'startup', 'cleanup', 'dev']],
];

function cli() {
  const top = parseHelp(help([])).commands;
  const placed = new Set(GROUPS.flatMap(([, cmds]) => cmds));
  const groups = GROUPS.map(([heading, cmds]) => ({
    heading,
    commands: cmds.filter((c) => top.some((t) => t.name === c)).flatMap((c) => walk([c], top.find((t) => t.name === c).about)),
  }));
  const extra = top.filter((t) => !placed.has(t.name));
  if (extra.length) groups.push({ heading: 'More', commands: extra.flatMap((t) => walk([t.name], t.about)) });
  groups.find((g) => g.heading === 'Daemon & diagnostics').commands.splice(1, 0, {
    name: '--mcp',
    signature: 'unflick --mcp',
    summary: 'Start the MCP server over stdio. See the MCP reference below.',
  });
  return groups.filter((g) => g.commands.length);
}

/** First sentence of a tool description — the table has one line per tool. */
function firstSentence(text) {
  const flat = (text ?? '').replace(/\s+/g, ' ').trim();
  const m = flat.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : flat;
}

function mcp() {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(BIN, ['--mcp'], { stdio: ['pipe', 'pipe', 'ignore'] });
    const replies = {};
    let buf = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('MCP server did not answer within 20s')); }, 20000);
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        try {
          const msg = JSON.parse(line);
          if (msg.id != null) replies[msg.id] = msg;
        } catch { /* not JSON-RPC */ }
        if (replies[2] && replies[3]) {
          clearTimeout(timer);
          child.kill();
          resolvePromise({
            version: replies[1]?.result?.serverInfo?.version ?? null,
            tools: replies[2].result.tools.map((t) => ({ name: t.name, summary: firstSentence(t.description) })),
            resources: replies[3].result.resources.map((r) => ({ uri: r.uri, summary: firstSentence(r.description ?? r.name) })),
          });
        }
      }
    });
    const send = (m) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
    send({ id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'unflick-website', version: '1' } } });
    send({ method: 'notifications/initialized' });
    send({ id: 2, method: 'tools/list' });
    send({ id: 3, method: 'resources/list' });
  });
}

const version = execFileSync(BIN, ['--version'], { encoding: 'utf8' }).trim().split(/\s+/).pop();
const { tools, resources } = await mcp();
const data = { version, cliGroups: cli(), mcpTools: tools, mcpResources: resources };
writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
const rows = data.cliGroups.reduce((n, g) => n + g.commands.length, 0);
console.log(`unflick ${version}: ${rows} CLI rows, ${tools.length} MCP tools, ${resources.length} resources → ${OUT}`);
