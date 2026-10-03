/**
 * Data for the docs page.
 *
 * The CLI and MCP tables come from reference.generated.json, which
 * scripts/gen-reference.mjs writes from a real unflick binary (`--help`
 * output plus a live MCP `tools/list` / `resources/list`). Re-run it after
 * every unflick release:
 *
 *   node scripts/gen-reference.mjs
 *
 * Command names, flags, JSON keys and example snippets are intentionally in
 * English — they're universal. Section prose lives in src/i18n/<lang>.json.
 */

import generated from './reference.generated.json';

export interface CliCommand {
  name: string;
  signature: string;
  summary: string;
}

export interface McpTool {
  name: string;
  summary: string;
}

export interface McpResource {
  uri: string;
  summary: string;
}

/** The unflick version the tables below were generated from. */
export const REFERENCE_VERSION: string = generated.version;

export const CLI_GROUPS: Array<{ heading: string; commands: CliCommand[] }> = generated.cliGroups;

export const MCP_TOOLS: McpTool[] = generated.mcpTools;

export const MCP_RESOURCES: McpResource[] = generated.mcpResources;

// The Homebrew cask, install.sh and the Linux packages put `unflick` on PATH.
// The Windows installers don't, hence MCP_WINDOWS_COMMAND.
export const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "unflick": {
      "command": "unflick",
      "args": ["--mcp"]
    }
  }
}`;

/** Where the Windows installers put the binary (per-user NSIS install). JSON-escaped. */
export const MCP_WINDOWS_COMMAND = 'C:\\\\Users\\\\<you>\\\\AppData\\\\Local\\\\Programs\\\\unflick\\\\unflick.exe';

export const CLAUDE_CODE_PLUGIN = `/plugin marketplace add zhitongblog/unflick
/plugin install unflick`;

export const QUICK_START_PLAYBACK = `# Open a file (or a YouTube URL)
unflick play movie.mp4

# Jump to the next chapter, then save a bookmark
unflick chapter next
unflick bookmark add --name "the good bit"

# Cut a 30-second GIF starting at 00:01:00
unflick clip 60 90 --file movie.mp4 --gif

# Find subtitles online, or generate them locally (AI edition: zero config)
unflick subtitle auto
unflick subtitle generate movie.mp4`;
