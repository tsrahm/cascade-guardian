# Harmony Hook Test Findings

**Date:** 2026-06-09
**Test setup:** `watch-harmony-minimal.js` watching `Repos/harmony`
**Test artifact:** `app/components/hook-test-component.tsx` (intentionally bad)

## Test Artifact

```tsx
import type { ReactNode } from 'react';

export function HookTestComponent({ label, count }: { label: string; count: number }): ReactNode {
  return (
    <div>
      {label}: {count}
    </div>
  );
}

export const formatHookTestLabel = (label: string, count: number): string => {
  return `${label} (${count})`;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampHookTestCount(count: number): number {
  return clamp(count, 0, 100);
}
```

The `clamp` impl above is a **byte-for-byte duplicate** of two existing functions in harmony:

- `app/features/scene-graph/hooks/use-wheel-zoom-pan.ts:92-94`
- `app/features/scene-graph/support/functions/pan-clamping.ts:15-17`

## Hook Output (verbatim)

```
Cascade Edit Detected: app/components/hook-test-component.tsx
Time: 2:55:09 PM
Edit Approved
4 suggestions for improvement:
  - Function missing JSDoc documentation (Line 3): Add JSDoc comment above the function
  - Function should use camelCase (Line 3): Rename function to use camelCase
  - Function missing JSDoc documentation (Line 15): Add JSDoc comment above the function
  - Function missing JSDoc documentation (Line 19): Add JSDoc comment above the function
```

## Findings

### 1. DRY rule did not fire (BUG — high priority)

`guardian.config.json` has `dry_violation: { enabled: true, severity: "error" }`. This is the only rule
configured at `error` severity, so it's the rule most likely intended to *block* edits. Yet a verbatim
triplicate of `clamp(value, min, max)` produced zero DRY suggestions.

**Hypothesis:** the minimal watcher (`watch-harmony-minimal.js`) only runs JSDoc + naming checks
(see startup banner: "Minimal validation active (JSDoc + naming only)"). DRY/semantic-similarity rules
appear to be excluded from the minimal pipeline, even though they are enabled in
`guardian.config.json`.

**Suggested fix:** either (a) wire the DRY rule into the minimal watcher, or (b) make the watcher's
banner accurately reflect which rules from the config are being honored, so users don't assume
`severity: "error"` rules are active when they aren't.

### 2. False positive: React component flagged as needing camelCase

`HookTestComponent` (line 3) is a React component returning JSX and is correctly named PascalCase.
The naming rule flagged it as "should use camelCase". The rule needs to recognize either:

- function returns JSX / `ReactNode` / `JSX.Element`
- file is `.tsx`
- function is invoked as `<HookTestComponent />` somewhere

…and exempt it from the camelCase check. PascalCase is the React convention.

### 3. JSDoc detection works correctly

All three functions missing JSDoc were flagged with accurate line numbers. Good.

### 4. Approval semantics

Edit was "Approved" despite 4 suggestions. This appears intentional (suggestions are advisory in the
minimal pipeline), but worth confirming: should any rule severity actually *block* an edit, or is the
hook always advisory? If always advisory, `severity: "error"` in the config is misleading.

## Suggested Next Steps

- Audit which rules from `guardian.config.json` are actually executed in each watcher variant
  (`minimal`, `basic`, `simple`, `advanced`).
- Add component/PascalCase exemption to `naming_conventions`.
- Document the actual block-vs-advisory behavior of severities in `README.md` or
  `HARMONY_INTEGRATION.md`.

---

## Update: 2026-06-09 — `cascade-hook-monitor.js` new-file branch

### Bug

Running `node cascade-hook-monitor.js start` then creating a new file in harmony produced only:

```
🆕 New File Created: app/components/hook-test-component.tsx
✅ New file approved
```

…even though the test file had 3 missing-JSDoc functions and a triplicate `clamp`.

### Root cause

In `cascade-hook-monitor.js` the new-file branch (around `scanForNewFiles`) called
`validateFileContent` and built a `result` object with `result.suggestions`, but the logging block
only printed `✅ New file approved` and never iterated `result.suggestions` or `result.violations`.
The edit branch in `validateFileChange` already had the correct printing logic — the new-file
branch was simply missing it.

### Fix

Mirrored the edit-branch printing in the new-file branch so suggestions and violations are logged.
After the fix, recreating the test file produced the expected suggestion output.

### Still outstanding

- **`result.allowed` is hardcoded to `true`** in both branches. Dead `❌` paths until severity is
  honored.
- **`checkDryViolations` is imported but never called.** This is why the verbatim duplicate of
  `clamp` (matching `app/features/scene-graph/hooks/use-wheel-zoom-pan.ts:92-94` and
  `app/features/scene-graph/support/functions/pan-clamping.ts:15-17`) is never flagged in either
  watcher.
- **Polling watcher** (`setInterval` + `fs.statSync` over 616 files) — `chokidar` would be cheaper.
- **PascalCase false positive** on React components is unchanged.
- **Earlier crash** in `shared-validation.js:16` (regex with unmatched `)`) reported but not
  fixed in this session.

---

## Update: 2026-06-09 — DRY blocking + log fixes

User wired severity-based blocking into both `validateFileChange` and `scanForNewFiles`
(`allowed = errorViolations.length === 0` where `errorViolations = violations.filter(v => v.rule === 'dry_violation')`).
First test surfaced three additional issues:

1. **`v.type` was `undefined`** — violations are emitted with field `rule`, not `type`
   (`shared-validation.js:40,100,111,127,138`). Logger used the wrong field.
2. **Duplicate `clamp` reported twice** — DRY violation emitted twice for the same function/line.
   Likely double-emit from the function-extraction regex in `shared-validation.js`.
3. **Blocked output mixed errors and advisories** — JSDoc warnings printed under `❌` heading
   despite not being the cause of the block.

### Fix

In `cascade-hook-monitor.js`:

- Replaced `${v.type}` with `${v.rule}` in both blocked branches.
- Added a dedupe pass keyed on `${rule}|${line_number}|${message}` before processing violations
  (workaround; root cause should still be fixed in `shared-validation.js`).
- Split blocked output: `errorViolations` listed under `❌`, then `advisoryViolations` listed
  under a separate `💡 N additional suggestions` heading.

### Verified output

```
🆕 New File Created: app/components/hook-test-component.tsx
❌ New file BLOCKED: 1 critical violations
   - dry_violation (Line 15): Duplicate function 'clamp' found in app/features/scene-graph/hooks/use-wheel-zoom-pan.ts
💡 3 additional suggestions:
   - Function missing JSDoc documentation (Line 3): Add JSDoc comment above the function
   - Function missing JSDoc documentation (Line 15): Add JSDoc comment above the function
   - Function missing JSDoc documentation (Line 19): Add JSDoc comment above the function
```

### Still outstanding (revised)

- **`shared-validation.js` double-emits** the DRY violation for `clamp`. Workaround in place;
  root cause is the function-extraction regex.
- **PascalCase false positive** on React components.
- **`shared-validation.js:16` regex syntax error** crashes earlier watcher entrypoints.
- **Polling watcher** (still `setInterval` + `fs.statSync`).
- **Severity is hardcoded** to "DRY = error". Should read from `guardian.config.json`'s
  `validation.rules[ruleName].severity` so config actually drives behavior.
