/**
 * Single source of truth for the docs page.
 *
 * Keep this aligned with src-tauri/src/cli/commands.rs (CLI surface) and
 * src-tauri/src/mcp/tools.rs / resources.rs (MCP surface) in the unflick repo.
 *
 * Command names, flags, JSON keys and example snippets are intentionally in
 * English — they're universal. Section prose lives in src/i18n/<lang>.json.
 */

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

export const CLI_GROUPS: Array<{ heading: string; commands: CliCommand[] }> = [
  {
    heading: 'Playback',
    commands: [
      { name: 'play', signature: 'unflick play <FILE> [--seek N] [--volume 0-100] [--speed N]', summary: 'Open a file and start playback. Resumes from saved position by default.' },
      { name: 'pause', signature: 'unflick pause', summary: 'Pause the currently playing file.' },
      { name: 'resume', signature: 'unflick resume', summary: 'Resume a paused file.' },
      { name: 'stop', signature: 'unflick stop', summary: 'Stop playback and save the current position.' },
      { name: 'seek', signature: 'unflick seek <SECONDS>', summary: 'Jump to an absolute position in seconds.' },
      { name: 'volume', signature: 'unflick volume <0-100>', summary: 'Set the volume level.' },
      { name: 'speed', signature: 'unflick speed <RATE>', summary: 'Set playback speed multiplier (e.g. 1.5).' },
      { name: 'status', signature: 'unflick status', summary: 'Print current playback state as JSON.' },
    ],
  },
  {
    heading: 'Media tools',
    commands: [
      { name: 'info', signature: 'unflick info <FILE>', summary: 'Probe a file for duration, codecs, fps, container — without disrupting playback.' },
      { name: 'screenshot', signature: 'unflick screenshot [--output PATH]', summary: 'Save the current frame as a PNG.' },
      { name: 'clip', signature: 'unflick clip <START> <END> [--file PATH] [--output PATH] [--gif]', summary: 'Extract a segment to MP4 or animated GIF (uses bundled ffmpeg).' },
    ],
  },
  {
    heading: 'Tracks',
    commands: [
      { name: 'subtitle load', signature: 'unflick subtitle load <FILE>', summary: 'Load an external .srt / .ass / .sub file.' },
      { name: 'subtitle list', signature: 'unflick subtitle list', summary: 'List embedded and external subtitle tracks.' },
      { name: 'subtitle select', signature: 'unflick subtitle select <ID>', summary: 'Switch to a subtitle track (0 disables).' },
      { name: 'subtitle generate', signature: 'unflick subtitle generate <VIDEO> [--mode local|api] [--whisper PATH] [--model PATH] [--api-key KEY]', summary: 'AI-generate subtitles. Auto-detects bundled whisper in the AI edition.' },
      { name: 'subtitle translate', signature: 'unflick subtitle translate <SRT> --to <LANG> --api-key <KEY>', summary: 'Translate an SRT file via OpenAI.' },
      { name: 'audio list', signature: 'unflick audio list', summary: 'List embedded audio tracks.' },
      { name: 'audio select', signature: 'unflick audio select <ID>', summary: 'Switch to an audio track (0 disables).' },
    ],
  },
  {
    heading: 'Playlist',
    commands: [
      { name: 'playlist add', signature: 'unflick playlist add <FILE>', summary: 'Append a file to the playlist.' },
      { name: 'playlist remove', signature: 'unflick playlist remove <INDEX>', summary: 'Remove an entry by index.' },
      { name: 'playlist list', signature: 'unflick playlist list', summary: 'Show all playlist entries with the current track marked.' },
      { name: 'playlist play', signature: 'unflick playlist play <INDEX>', summary: 'Jump to a specific entry.' },
      { name: 'playlist next', signature: 'unflick playlist next', summary: 'Advance to the next track.' },
      { name: 'playlist prev', signature: 'unflick playlist prev', summary: 'Go back to the previous track.' },
      { name: 'playlist clear', signature: 'unflick playlist clear', summary: 'Remove all entries.' },
    ],
  },
  {
    heading: 'Library',
    commands: [
      { name: 'library scan', signature: 'unflick library scan <DIR>', summary: 'Scan a directory for video files into the SQLite library.' },
      { name: 'library search', signature: 'unflick library search <QUERY>', summary: 'Search the library by title or path.' },
      { name: 'library list', signature: 'unflick library list', summary: 'List every entry in the library.' },
      { name: 'library remove', signature: 'unflick library remove <ID>', summary: 'Remove an entry by ID.' },
    ],
  },
  {
    heading: 'Filters',
    commands: [
      { name: 'filter list', signature: 'unflick filter list', summary: 'Show current values of brightness / contrast / saturation / gamma / hue.' },
      { name: 'filter set', signature: 'unflick filter set <NAME> <-100..100>', summary: 'Adjust a single filter.' },
      { name: 'filter reset', signature: 'unflick filter reset', summary: 'Set every filter back to 0.' },
    ],
  },
  {
    heading: 'Settings',
    commands: [
      { name: 'settings path', signature: 'unflick settings path', summary: 'Print the absolute settings.json path.' },
      { name: 'settings get', signature: 'unflick settings get [--key K]', summary: 'Print all settings, or a single key.' },
      { name: 'settings set', signature: 'unflick settings set <KEY> <JSON-VALUE>', summary: 'Set a key (parses as JSON; falls back to string).' },
      { name: 'settings unset', signature: 'unflick settings unset <KEY>', summary: 'Remove a key.' },
    ],
  },
  {
    heading: 'Server',
    commands: [
      { name: 'daemon', signature: 'unflick daemon', summary: 'Start the background daemon explicitly. Other CLI commands auto-start it on first use.' },
      { name: '--mcp', signature: 'unflick --mcp', summary: 'Start the MCP server over stdio. See the MCP section below.' },
      { name: 'shutdown', signature: 'unflick shutdown', summary: 'Stop the running daemon.' },
    ],
  },
];

export const MCP_TOOLS: McpTool[] = [
  // Playback
  { name: 'play', summary: 'Play a video file with optional seek/volume/speed.' },
  { name: 'pause', summary: 'Pause playback.' },
  { name: 'resume', summary: 'Resume playback.' },
  { name: 'stop', summary: 'Stop playback.' },
  { name: 'seek', summary: 'Seek to a position in seconds.' },
  { name: 'set_volume', summary: 'Set the volume (0-100).' },
  { name: 'set_speed', summary: 'Set playback speed.' },
  { name: 'get_status', summary: 'Read state, file, position, duration, volume, speed.' },
  { name: 'file_info', summary: 'Probe a media file (duration, resolution, codecs, fps, container).' },
  // Tracks
  { name: 'load_subtitle', summary: 'Load an external subtitle file.' },
  { name: 'subtitle_list', summary: 'List subtitle tracks (embedded + external).' },
  { name: 'subtitle_select', summary: 'Switch subtitle track by ID (0 disables).' },
  { name: 'audio_list', summary: 'List embedded audio tracks.' },
  { name: 'audio_select', summary: 'Switch audio track by ID.' },
  // AI
  { name: 'generate_subtitles', summary: 'Whisper-generate subtitles (local or OpenAI mode).' },
  { name: 'translate_subtitles', summary: 'Translate an SRT via OpenAI.' },
  // Playlist
  { name: 'playlist_add', summary: 'Append a file to the playlist.' },
  { name: 'playlist_remove', summary: 'Remove a playlist entry by index.' },
  { name: 'playlist_list', summary: 'List playlist entries.' },
  { name: 'playlist_play', summary: 'Jump to a playlist entry by index.' },
  { name: 'playlist_next', summary: 'Advance to the next track.' },
  { name: 'playlist_prev', summary: 'Go back to the previous track.' },
  { name: 'playlist_clear', summary: 'Remove all entries.' },
  // Library
  { name: 'library_scan', summary: 'Scan a directory for video files into the library.' },
  { name: 'library_search', summary: 'Search the library by title or path.' },
  { name: 'library_list', summary: 'List every entry.' },
  { name: 'library_remove', summary: 'Remove a library entry by ID.' },
  // Capture
  { name: 'screenshot', summary: 'Save the current frame as a PNG.' },
  { name: 'clip', summary: 'Extract a video segment to MP4 or GIF.' },
  // Position memory
  { name: 'save_position', summary: 'Save a playback position for later resume.' },
  { name: 'get_position', summary: 'Look up the saved position for a file.' },
  // Settings
  { name: 'settings_path', summary: 'Get the path of settings.json.' },
  { name: 'settings_get', summary: 'Read all settings, or a single key.' },
  { name: 'settings_set', summary: 'Set a single settings key to any JSON value.' },
  { name: 'settings_unset', summary: 'Remove a settings key.' },
  // Filters
  { name: 'filter_list', summary: 'Read brightness/contrast/saturation/gamma/hue.' },
  { name: 'filter_set', summary: 'Set one of those filters to a value in -100..100.' },
  { name: 'filter_reset', summary: 'Reset all filters to 0.' },
  // Lifecycle
  { name: 'shutdown', summary: 'Shut down the unflick daemon.' },
];

export const MCP_RESOURCES: McpResource[] = [
  { uri: 'unflick://now-playing', summary: 'Current playback state — file, position, duration, volume, speed.' },
  { uri: 'unflick://playlist', summary: 'Current playlist with the active track marked.' },
  { uri: 'unflick://library', summary: 'Every media file in the library.' },
];

export const MCP_CONFIG_SNIPPET = `{
  "mcpServers": {
    "unflick": {
      "command": "C:\\\\Users\\\\<you>\\\\AppData\\\\Local\\\\unflick\\\\unflick.exe",
      "args": ["--mcp"]
    }
  }
}`;

export const QUICK_START_PLAYBACK = `# Open a file
unflick play movie.mp4

# Save a screenshot of the current frame
unflick screenshot --output frame.png

# Cut a 30-second GIF starting at 00:01:00
unflick clip 60 90 --file movie.mp4 --gif

# Generate subtitles (AI edition: zero config)
unflick subtitle generate movie.mp4`;
