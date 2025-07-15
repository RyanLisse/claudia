import { motion } from "framer-motion";
import {
	BarChart3,
	Circle,
	ExternalLink,
	FileText,
	Info,
	Network,
	Settings,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { api, type ClaudeVersionStatus } from "@/lib/api-web";
import { cn } from "@/lib/utils";

interface TopbarProps {
	/**
	 * Callback when CLAUDE.md is clicked
	 */
	onClaudeClick: () => void;
	/**
	 * Callback when Settings is clicked
	 */
	onSettingsClick: () => void;
	/**
	 * Callback when Usage Dashboard is clicked
	 */
	onUsageClick: () => void;
	/**
	 * Callback when MCP is clicked
	 */
	onMCPClick: () => void;
	/**
	 * Callback when Info is clicked
	 */
	onInfoClick: () => void;
	/**
	 * Optional className for styling
	 */
	className?: string;
}

/**
 * Topbar component with status indicator and navigation buttons
 *
 * @example
 * <Topbar
 *   onClaudeClick={() => setView('editor')}
 *   onSettingsClick={() => setView('settings')}
 *   onUsageClick={() => setView('usage-dashboard')}
 *   onMCPClick={() => setView('mcp')}
 * />
 */
export const Topbar: React.FC<TopbarProps> = ({
	onClaudeClick,
	onSettingsClick,
	onUsageClick,
	onMCPClick,
	onInfoClick,
	className,
}) => {
	const [versionStatus, setVersionStatus] =
		useState<ClaudeVersionStatus | null>(null);
	const [checking, setChecking] = useState(true);

	// Check Claude version on mount
	useEffect(() => {
		checkVersion();
	}, [checkVersion]);

	const checkVersion = React.useCallback(async () => {
		try {
			setChecking(true);
			const status = await api.checkClaudeVersion();
			setVersionStatus(status);

			// If Claude is not installed and the error indicates it wasn't found
			if (
				!status.is_installed &&
				status.output.includes("No such file or directory")
			) {
				// Emit an event that can be caught by the parent
				window.dispatchEvent(new CustomEvent("claude-not-found"));
			}
		} catch (_err) {
			setVersionStatus({
				is_installed: false,
				output: "Failed to check version",
			});
		} finally {
			setChecking(false);
		}
	}, []);

	const StatusIndicator = () => {
		if (checking) {
			return (
				<div className="flex items-center space-x-2 text-xs">
					<Circle className="h-3 w-3 animate-pulse text-muted-foreground" />
					<span className="text-muted-foreground">Checking...</span>
				</div>
			);
		}

		if (!versionStatus) return null;

		const statusContent = (
			<Button
				variant="ghost"
				size="sm"
				className="h-auto px-2 py-1 hover:bg-accent"
				onClick={onSettingsClick}
			>
				<div className="flex items-center space-x-2 text-xs">
					<Circle
						className={cn(
							"h-3 w-3",
							versionStatus.is_installed
								? "fill-green-500 text-green-500"
								: "fill-red-500 text-red-500",
						)}
					/>
					<span>
						{versionStatus.is_installed && versionStatus.version
							? `Claude Code v${versionStatus.version}`
							: "Claude Code"}
					</span>
				</div>
			</Button>
		);

		if (!versionStatus.is_installed) {
			return (
				<Popover
					trigger={statusContent}
					content={
						<div className="max-w-xs space-y-3">
							<p className="font-medium text-sm">Claude Code not found</p>
							<div className="rounded-md bg-muted p-3">
								<pre className="whitespace-pre-wrap font-mono text-xs">
									{versionStatus.output}
								</pre>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={onSettingsClick}
							>
								Select Claude Installation
							</Button>
							<a
								href="https://www.anthropic.com/claude-code"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center space-x-1 text-primary text-xs hover:underline"
							>
								<span>Install Claude Code</span>
								<ExternalLink className="h-3 w-3" />
							</a>
						</div>
					}
					align="start"
				/>
			);
		}

		return statusContent;
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			className={cn(
				"flex items-center justify-between border-border border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
				className,
			)}
		>
			{/* Status Indicator */}
			<StatusIndicator />

			{/* Action Buttons */}
			<div className="flex items-center space-x-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={onUsageClick}
					className="text-xs"
				>
					<BarChart3 className="mr-2 h-3 w-3" />
					Usage Dashboard
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onClick={onClaudeClick}
					className="text-xs"
				>
					<FileText className="mr-2 h-3 w-3" />
					CLAUDE.md
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onClick={onMCPClick}
					className="text-xs"
				>
					<Network className="mr-2 h-3 w-3" />
					MCP
				</Button>

				<Button
					variant="ghost"
					size="sm"
					onClick={onSettingsClick}
					className="text-xs"
				>
					<Settings className="mr-2 h-3 w-3" />
					Settings
				</Button>

				<Button
					variant="ghost"
					size="icon"
					onClick={onInfoClick}
					className="h-8 w-8"
					title="About"
				>
					<Info className="h-4 w-4" />
				</Button>
			</div>
		</motion.div>
	);
};
