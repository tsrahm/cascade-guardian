/**
 * Central configuration resolver for Cascade Guardian.
 *
 * All paths are derived at runtime — zero hardcoded paths.
 * Resolution order:
 *   1. Environment variable overrides (GUARDIAN_PROJECT_ROOT, etc.)
 *   2. guardian.config.json at project root (optional per-project overrides)
 *   3. Auto-detection (git root, tsconfig.json, package.json)
 *   4. Sensible defaults
 */
export interface GuardianConfig {
    /** Absolute path to the project root (git root or cwd) */
    projectRoot: string;
    /** Project name (from package.json or directory name) */
    projectName: string;
    /** Directories containing source files to index */
    sourceDirectories: string[];
    /** Directories containing documentation to index */
    docsDirectories: string[];
    /** Directories to exclude from scanning */
    excludeDirectories: string[];
    /** File extensions to scan (e.g., ['.ts', '.tsx']) */
    fileExtensions: string[];
    /** Absolute path to the SQLite database for this project */
    databasePath: string;
    /** Absolute path to the guardian install directory */
    installPath: string;
    /** Absolute path to the validation debug log */
    logPath: string;
    /** Absolute path to the suggestion log */
    suggestionsPath: string;
    /** JSDoc validation settings */
    jsdoc: {
        requiredTags: string[];
        minTags: number;
        minCommentLength: number;
    };
}
/**
 * Returns the guardian install directory (~/.cascade-guardian/).
 * Creates it if it doesn't exist.
 */
export declare function getGuardianHome(): string;
/**
 * Detects the project root directory.
 * Priority: GUARDIAN_PROJECT_ROOT env var > git root > cwd
 */
export declare function detectProjectRoot(fromPath?: string): string;
/**
 * Derives the project root from a file path by walking up to find .git/.
 * Used by hooks that receive an absolute file path from tool_input.
 */
export declare function detectProjectRootFromFile(filePath: string): string;
/**
 * Creates a stable, short hash of the project root for use as a directory name.
 * Example: /Users/austin/Git/my-project → "a3f2b1c8"
 */
export declare function hashProjectRoot(projectRoot: string): string;
/**
 * Resolves the full GuardianConfig for a project.
 *
 * Results are cached by resolved project root, so repeated calls
 * (e.g., from multiple module-level initializations) are free after the first.
 *
 * @param fromPath Optional path to resolve from (file path or directory).
 *   If a file path, walks up to find the project root.
 *   If omitted, uses GUARDIAN_PROJECT_ROOT or git root or cwd.
 */
export declare function resolveConfig(fromPath?: string): GuardianConfig;
/**
 * Ensures all required directories exist for a resolved config.
 * Call this during install or first-time setup.
 */
export declare function ensureDirectories(config: GuardianConfig): void;
/**
 * Registers this project in the global projects.json manifest.
 * Used for discoverability — lists all projects Guardian has indexed.
 */
export declare function registerProject(config: GuardianConfig): void;
//# sourceMappingURL=config.d.ts.map