/**
 * Type definitions for Claude Code hooks configuration
 * This file provides strong typing for the hooks validation and management system
 */

export interface HooksConfiguration {
	/**
	 * Pre-tool-use hooks - executed before a tool is used
	 * Uses matchers to determine when to execute
	 */
	PreToolUse?: HookMatcher[];

	/**
	 * Post-tool-use hooks - executed after a tool is used
	 * Uses matchers to determine when to execute
	 */
	PostToolUse?: HookMatcher[];

	/**
	 * Notification hooks - executed when notifications are sent
	 * No matchers needed, executed on all notifications
	 */
	Notification?: HookCommand[];

	/**
	 * Stop hooks - executed when a session is stopped
	 * No matchers needed, executed on all stops
	 */
	Stop?: HookCommand[];

	/**
	 * Sub-agent stop hooks - executed when a sub-agent is stopped
	 * No matchers needed, executed on all sub-agent stops
	 */
	SubagentStop?: HookCommand[];
}

export interface HookMatcher {
	/**
	 * Regex pattern to match against tool names or other criteria
	 * Empty string or undefined means match all
	 */
	matcher: string;

	/**
	 * Array of hook commands to execute when the matcher matches
	 */
	hooks: HookCommand[];
}

export interface HookCommand {
	/**
	 * The shell command to execute
	 */
	command: string;

	/**
	 * Optional description of what this hook does
	 */
	description?: string;

	/**
	 * Optional working directory for command execution
	 */
	cwd?: string;

	/**
	 * Optional environment variables to set
	 */
	env?: Record<string, string>;

	/**
	 * Optional timeout in milliseconds
	 */
	timeout?: number;

	/**
	 * Whether to run in background (don't wait for completion)
	 */
	background?: boolean;
}

export interface HookValidationResult {
	/**
	 * Whether the configuration is valid
	 */
	valid: boolean;

	/**
	 * Array of validation errors
	 */
	errors: HookValidationError[];

	/**
	 * Array of validation warnings
	 */
	warnings: HookValidationWarning[];
}

export interface HookValidationError {
	/**
	 * The event that caused the error
	 */
	event: string;

	/**
	 * The matcher pattern that caused the error (if applicable)
	 */
	matcher?: string;

	/**
	 * The command that caused the error (if applicable)
	 */
	command?: string;

	/**
	 * Error message
	 */
	message: string;
}

export interface HookValidationWarning {
	/**
	 * The event that caused the warning
	 */
	event: string;

	/**
	 * The matcher pattern that caused the warning (if applicable)
	 */
	matcher?: string;

	/**
	 * The command that caused the warning (if applicable)
	 */
	command?: string;

	/**
	 * Warning message
	 */
	message: string;
}

/**
 * Common tool matchers for convenience
 */
export const COMMON_TOOL_MATCHERS = {
	ALL_TOOLS: ".*",
	READ_TOOLS: "(read|cat|head|tail|less|more)",
	WRITE_TOOLS: "(write|echo|tee|redirect)",
	EDIT_TOOLS: "(edit|nano|vim|emacs|code)",
	SEARCH_TOOLS: "(grep|find|locate|search)",
	NETWORK_TOOLS: "(curl|wget|ping|telnet|ssh)",
	PACKAGE_TOOLS: "(npm|yarn|pip|cargo|go)",
	GIT_TOOLS: "(git)",
	BUILD_TOOLS: "(make|cmake|ninja|bazel)",
	TEST_TOOLS: "(test|jest|pytest|cargo test)",
	DANGEROUS_TOOLS: "(rm|delete|format|dd|sudo)",
} as const;

export type CommonToolMatcher = keyof typeof COMMON_TOOL_MATCHERS;

/**
 * Predefined hook templates for common use cases
 */
export const HOOK_TEMPLATES = {
	AUTO_FORMAT: {
		matcher: COMMON_TOOL_MATCHERS.EDIT_TOOLS,
		hooks: [
			{
				command: "prettier --write ${file}",
				description: "Auto-format file after editing",
			},
		],
	},
	AUTO_COMMIT: {
		matcher: COMMON_TOOL_MATCHERS.WRITE_TOOLS,
		hooks: [
			{
				command:
					'git add ${file} && git commit -m "Auto-commit: ${description}"',
				description: "Auto-commit changes",
			},
		],
	},
	BACKUP_BEFORE_EDIT: {
		matcher: COMMON_TOOL_MATCHERS.EDIT_TOOLS,
		hooks: [
			{
				command: "cp ${file} ${file}.backup",
				description: "Create backup before editing",
			},
		],
	},
	LINT_AFTER_EDIT: {
		matcher: COMMON_TOOL_MATCHERS.EDIT_TOOLS,
		hooks: [
			{
				command: "eslint ${file} --fix",
				description: "Lint and fix file after editing",
			},
		],
	},
	NOTIFY_ON_ERROR: {
		matcher: ".*",
		hooks: [
			{
				command: 'notify-send "Claude Code Error" "${error_message}"',
				description: "Send desktop notification on error",
			},
		],
	},
} as const;

export type HookTemplate = keyof typeof HOOK_TEMPLATES;

/**
 * Hook execution context passed to commands
 */
export interface HookContext {
	/**
	 * The tool that triggered the hook
	 */
	tool: string;

	/**
	 * File path being operated on (if applicable)
	 */
	file?: string;

	/**
	 * Project path
	 */
	project?: string;

	/**
	 * Error message (for error hooks)
	 */
	error_message?: string;

	/**
	 * Tool description or user input
	 */
	description?: string;

	/**
	 * Additional context variables
	 */
	[key: string]: any;
}

/**
 * Type guard to check if a value is a valid HooksConfiguration
 */
export function isHooksConfiguration(value: any): value is HooksConfiguration {
	if (!value || typeof value !== "object") return false;

	const config = value as HooksConfiguration;

	// Check PreToolUse
	if (config.PreToolUse && !Array.isArray(config.PreToolUse)) return false;
	if (config.PreToolUse && !config.PreToolUse.every(isHookMatcher))
		return false;

	// Check PostToolUse
	if (config.PostToolUse && !Array.isArray(config.PostToolUse)) return false;
	if (config.PostToolUse && !config.PostToolUse.every(isHookMatcher))
		return false;

	// Check Notification
	if (config.Notification && !Array.isArray(config.Notification)) return false;
	if (config.Notification && !config.Notification.every(isHookCommand))
		return false;

	// Check Stop
	if (config.Stop && !Array.isArray(config.Stop)) return false;
	if (config.Stop && !config.Stop.every(isHookCommand)) return false;

	// Check SubagentStop
	if (config.SubagentStop && !Array.isArray(config.SubagentStop)) return false;
	if (config.SubagentStop && !config.SubagentStop.every(isHookCommand))
		return false;

	return true;
}

/**
 * Type guard to check if a value is a valid HookMatcher
 */
export function isHookMatcher(value: any): value is HookMatcher {
	if (!value || typeof value !== "object") return false;

	const matcher = value as HookMatcher;

	if (typeof matcher.matcher !== "string") return false;
	if (!Array.isArray(matcher.hooks)) return false;
	if (!matcher.hooks.every(isHookCommand)) return false;

	return true;
}

/**
 * Type guard to check if a value is a valid HookCommand
 */
export function isHookCommand(value: any): value is HookCommand {
	if (!value || typeof value !== "object") return false;

	const command = value as HookCommand;

	if (typeof command.command !== "string") return false;

	if (command.description && typeof command.description !== "string")
		return false;
	if (command.cwd && typeof command.cwd !== "string") return false;
	if (command.env && typeof command.env !== "object") return false;
	if (command.timeout && typeof command.timeout !== "number") return false;
	if (command.background && typeof command.background !== "boolean")
		return false;

	return true;
}
