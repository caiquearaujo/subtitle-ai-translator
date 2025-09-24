# Subtitle AI Translator

A tiny CLI that translates SRT subtitle files line by line using the OpenAI API, preserving timing and structure. It supports resumable runs via checkpoints and optional line wrapping for better on‑screen readability.

- Translate `.srt` files to a target locale (e.g., `en-US`, `pt-BR`)
- Uses OpenAI Chat Completions with light context for better quality
- Progress bar with ETA and automatic checkpointing/resume
- Optional post‑processing to wrap long lines

## Requirements

- Node.js 18+ (recommended 18 or newer)
- An OpenAI API key

## Installation

This package is not published to npm (private: true). Install from source:

```bash
git clone https://github.com/caiquearaujo/subtitle-ai-translator.git
cd subtitle-ai-translator
npm install
npm run build
npm link      # exposes the `subsrt` CLI globally
```

Alternatively, for local development without linking:

```bash
npm install
npx tsx src/index.ts <command> [options]
```

## Configuration

Create the config file and set your API key:

```bash
subsrt init
```

This creates `~/.config/subtitle-ai-translator.ini` with secure permissions and the following template:

```ini
[app]
model = gpt-5-mini
temperature = 0.3
api_key =
break = 42
```

- api_key: required. Paste your OpenAI API key here.
- model: OpenAI model ID (defaults to gpt-5-mini).
- temperature: 0.0–1.0 (defaults to 0.3).
- break: target line length used for wrapping translated text (defaults to 42).
- reasoning: optional, one of minimal | low | medium | high (defaults to low). You can add this key manually if desired.

## Usage

After configuring your API key:

```bash
subsrt translate -s path/to/input.srt -t en-US
```

By default, the output is saved alongside the input using the pattern:
`<original-filename>.<target>.srt` (e.g., `movie.pt-BR.srt`).

### Commands

- init
  - Creates `~/.config/subtitle-ai-translator.ini` with defaults.
- translate
  - Translates an SRT file to the specified target locale.

### Options (translate)

- -s, --source <path>
  - Path to the source `.srt` file (required).
- -t, --target <language>
  - Target locale code in the format `xx-XX` (e.g., `en-US`, `pt-BR`) (required).
- -o, --output <path>
  - Output file path or directory. If a directory is provided, the filename will be `<source>.<target>.srt`.
- -b, --break <length>
  - Displayed in the CLI help. Note: in v1.0.0 the effective break length is read from the config file (see Known Notes).

### Examples

- Basic translation to Brazilian Portuguese:

  ```bash
  subsrt translate -s ./movie.srt -t pt-BR
  ```

- Specify an explicit output path:

  ```bash
  subsrt translate -s ./movie.srt -t en-US -o ./out/movie.en-US.srt
  ```

- Specify an output directory:

  ```bash
  subsrt translate -s ./movie.srt -t es-ES -o ./out
  ```

## How It Works

- Parses the input `.srt` file and processes each cue.
- Builds a translation prompt including:
  - The target locale
  - The current line
  - Light context from up to 4 previous translated lines and the next line
- Calls OpenAI Chat Completions with your configured `model`, `temperature`, and `reasoning`.
- Writes output `.srt` with translated text and the same timing.
- Saves a checkpoint every 10 lines (and on errors) so you can safely resume.

Progress will show lines processed, percentage, and ETA. If interrupted, simply rerun the command with the same parameters; it resumes automatically.

## Target Language Codes

Use a two‑letter language code plus a two‑letter region, e.g.:

- en-US, en-GB
- pt-BR, pt-PT
- es-ES, fr-FR, de-DE

Note: plain `en` or `pt` will be rejected by the validator; use `xx-XX`.

## Debugging

Enable verbose logs from the internal translator flow:

```bash
DEBUG=cmd subsrt translate -s ./movie.srt -t en-US
```

## Known Notes (v1.0.0)

- Input format: Only `.srt` is supported.
- Line wrapping: The effective break length is read from the config file (`[app].break`). The `-b/--break` CLI flag is currently listed in help but not applied at runtime.
- Costs: Using the OpenAI API will incur usage charges on your account.

## Development

- Format: `npm run format`
- Lint: `npm run lint`
- Type check: `npm run check`
- Build: `npm run build`

Run locally without linking:

```bash
npx tsx src/index.ts translate -s ./movie.srt -t en-US
```

## Changelog

See CHANGELOG.md.

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md before opening issues or PRs.

## License

MIT License. See LICENSE.

# Subtitle AI Translator

A tiny CLI that translates SRT subtitle files line by line, preserving timing and structure. It supports multiple LLM providers, resumable runs via checkpoints, and optional line wrapping for better on‑screen readability.

- Translate `.srt` files to a target locale (e.g., `en-US`, `pt-BR`).
- Providers: OpenAI, Google (Gemini), and Ollama (local).
- Progress bar with ETA and automatic checkpointing/resume.
- Optional post‑processing to wrap long lines.

## Requirements

- Node.js 18+ (recommended 18 or newer)
- One of the following, depending on provider:
  - OpenAI: an API key
  - Google (Gemini): an API key
  - Ollama: local server running (default host `http://localhost:11434`)

## Installation

Install from source:

```bash
git clone https://github.com/caiquearaujo/subtitle-ai-translator.git
cd subtitle-ai-translator
npm install
npm run build
npm link      # exposes the `subsrt` CLI globally
```

Alternatively, for local development without linking:

```bash
npm install
npx tsx src/index.ts <command> [options]
```

## Configuration

Create the config file and set your provider options:

```bash
subsrt init
```

This creates `~/.config/subtitle-ai-translator.ini` with secure permissions and the following template:

```ini
[app]
break = 42
service = openai
checkpoint = true
debug = false

[openai]
model = gpt-5-mini
temperature = 0.3
api_key =
reasoning = low
timeout = 60000

[ollama]
model = qwen3:8b
reasoning = true
temperature = 0.3

[google]
model = gemini-2.0-flash
temperature = 0.3
api_key =
```

Keys overview:

- [app]
  - break: line wrap length for post‑processing (default 42).
  - service: which provider to use: `openai` | `google` | `ollama` (default `openai`).
  - checkpoint: enable resume via checkpoint file next to the output (default true).
  - debug: verbose logging and disables the animated progress bar (default false).
- [openai]
  - api_key: required when `service = openai`.
  - model: defaults to `gpt-5-mini`.
  - temperature: 0.0–1.0 (default 0.3).
  - reasoning: one of `minimal | low | medium | high` (default `low`).
  - timeout: request timeout in ms (default 60000).
- [ollama]
  - model: local model name/tag (template uses `qwen3:8b`; the code default is `aya:8b`).
  - reasoning: boolean, toggles Ollama "think" responses (default false).
  - temperature: 0.0–1.0 (default 0.3).
  - host: optional; defaults to `http://localhost:11434` if omitted.
- [google]
  - api_key: required when `service = google`.
  - model: defaults to `gemini-2.0-flash`.
  - temperature: 0.0–1.0 (default 0.3).

## Usage

After configuring your provider and credentials:

```bash
subsrt translate -s path/to/input.srt -t en-US
```

By default, the output is saved alongside the input using the pattern:
`<original-filename>.<target>.srt` (e.g., `movie.pt-BR.srt`).

### Commands

- init
  - Creates `~/.config/subtitle-ai-translator.ini` with defaults.
- translate
  - Translates an SRT file to the specified target locale using the configured provider.

### Options (translate)

- -s, --source <path>
  - Path to the source `.srt` file (required).
- -t, --target <language>
  - Target locale code in the format `xx-XX` (e.g., `en-US`, `pt-BR`) (required).
- -o, --output <path>
  - Output file path or directory. If a directory is provided, the filename will be `<source>.<target>.srt`.

### Examples

- Basic translation to Brazilian Portuguese:

  ```bash
  subsrt translate -s ./movie.srt -t pt-BR
  ```

- Specify an explicit output path:

  ```bash
  subsrt translate -s ./movie.srt -t en-US -o ./out/movie.en-US.srt
  ```

- Specify an output directory:

  ```bash
  subsrt translate -s ./movie.srt -t es-ES -o ./out
  ```

## How It Works

- Parses the input `.srt` file and processes each cue.
- Builds a translation prompt including:
  - The target locale
  - The current line
  - Light context from up to 4 previous translated lines and the next line
- Calls the selected provider with your configured settings:
  - OpenAI: Chat Completions (`model`, `temperature`, `reasoning`, `timeout`).
  - Google: Generative Models (`model`, `temperature`).
  - Ollama: Local chat (`model`, `temperature`, optional `reasoning` via think, optional `host`).
- Writes output `.srt` with translated text and the same timing.
- Saves a checkpoint every 10 lines (and on errors) so you can safely resume when `[app].checkpoint = true`.

Progress will show lines processed, percentage, and ETA. If interrupted, simply rerun the command with the same parameters; it resumes automatically.

## Target Language Codes

Use a two‑letter language code plus a two‑letter region, e.g.:

- en-US, en-GB
- pt-BR, pt-PT
- es-ES, fr-FR, de-DE

Note: plain `en` or `pt` will be rejected by the validator; use `xx-XX`.

## Debugging

Enable verbose logs from the internal translator flow:

```bash
DEBUG=cmd subsrt translate -s ./movie.srt -t en-US
```

Additionally, setting `[app].debug = true` in the config will:

- Print internal prompts and per‑line translations to stdout.
- Disable the animated progress bar (useful for CI logs).

## Known Notes (v1.0.0)

- Input format: Only `.srt` is supported.
- Line wrapping: The effective break length is read from the config file (`[app].break`). The `-b/--break` CLI flag is currently listed in help but not applied at runtime.
- Providers:
  - OpenAI and Google require API keys; usage may incur costs on your account.
  - Ollama requires a local server (default `http://localhost:11434`). You can change the `host` via config.

## Development

- Format: `npm run format`
- Lint: `npm run lint`
- Type check: `npm run check`
- Build: `npm run build`

Run locally without linking:

```bash
npx tsx src/index.ts translate -s ./movie.srt -t en-US
```

## Changelog

See CHANGELOG.md.

## Contributing

Contributions are welcome! Please read CONTRIBUTING.md before opening issues or PRs.

## License

MIT License. See LICENSE.
