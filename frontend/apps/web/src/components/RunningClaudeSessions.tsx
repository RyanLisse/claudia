import { motion } from "framer-motion";
import { AlertCircle, Loader2, Play, Terminal } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, type Session } from "@/lib/api-web";

// ProcessInfo type for web compatibility
interface ProcessInfo {
	run_id: number;
	process_type: { ClaudeSession: { session_id: string } } | { AgentRun: { agent_id: number; agent_name: string } };
	pid: number;
	started_at: string;
	project_path: string;
	task: string;
	model: string;
}
import { cn } from "@/lib/utils";

interface RunningClaudeSessionsProps {
	/**
	 * Callback when a running session is clicked to resume
	 */
	onSessionClick?: (session: Session) => void;
	/**
	 * Optional className for styling
	 */
	className?: string;
}

/**
 * Component to display currently running Claude sessions
 */
export const RunningClaudeSessions: React.FC<RunningClaudeSessionsProps> = ({
	onSessionClick,
	className,
}) => {
	const [runningSessions, setRunningSessions] = useState<ProcessInfo[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadRunningSessions();

		// Poll for updates every 5 seconds
		const interval = setInterval(loadRunningSessions, 5000);
		return () => clearInterval(interval);
	}, [loadRunningSessions]);

	const loadRunningSessions = async () => {
		try {
			const sessions = await api.listRunningAgentSessions();
			// Convert to ProcessInfo format for web compatibility
			const processInfos: ProcessInfo[] = sessions.map(session => ({
				run_id: session.id || 0,
				process_type: { ClaudeSession: { session_id: session.id?.toString() || "unknown" } },
				pid: 0,
				started_at: session.started_at || new Date().toISOString(),
				project_path: session.project_path || "/unknown",
				task: session.task || "Unknown task",
				model: session.model || "unknown"
			}));
			setRunningSessions(processInfos);
			setError(null);
		} catch (_err) {
			setError("Failed to load running sessions");
		} finally {
			setLoading(false);
		}
	};

	const formatTimestamp = (timestamp: string) => {
		try {
			return new Date(timestamp).toLocaleString();
		} catch {
			return timestamp;
		}
	};

	const handleResumeSession = (processInfo: ProcessInfo) => {
		// Extract session ID from process type
		if ("ClaudeSession" in processInfo.process_type) {
			const sessionId = processInfo.process_type.ClaudeSession.session_id;

			// Create a minimal session object for resumption
			const session: Session = {
				id: sessionId,
				project_id: processInfo.project_path.replace(/[^a-zA-Z0-9]/g, "-"),
				project_path: processInfo.project_path,
				created_at: new Date(processInfo.started_at).getTime() / 1000,
			};

			// Emit event to navigate to the session
			const event = new CustomEvent("claude-session-selected", {
				detail: { session, projectPath: processInfo.project_path },
			});
			window.dispatchEvent(event);

			onSessionClick?.(session);
		}
	};

	if (loading && runningSessions.length === 0) {
		return (
			<div className={cn("flex items-center justify-center py-4", className)}>
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (error) {
		return (
			<div
				className={cn(
					"flex items-center gap-2 text-destructive text-sm",
					className,
				)}
			>
				<AlertCircle className="h-4 w-4" />
				<span>{error}</span>
			</div>
		);
	}

	if (runningSessions.length === 0) {
		return null;
	}

	return (
		<div className={cn("space-y-3", className)}>
			<div className="flex items-center gap-2">
				<div className="flex items-center gap-1">
					<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
					<h3 className="font-medium text-sm">Active Claude Sessions</h3>
				</div>
				<span className="text-muted-foreground text-xs">
					({runningSessions.length} running)
				</span>
			</div>

			<div className="space-y-2">
				{runningSessions.map((session) => {
					const sessionId =
						"ClaudeSession" in session.process_type
							? session.process_type.ClaudeSession.session_id
							: null;

					if (!sessionId) return null;

					return (
						<motion.div
							key={session.run_id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.2 }}
						>
							<Card className="cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md">
								<CardContent
									className="p-3"
									onClick={() => handleResumeSession(session)}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex min-w-0 flex-1 items-start gap-3">
											<Terminal className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
											<div className="min-w-0 flex-1 space-y-1">
												<div className="flex items-center gap-2">
													<p className="truncate font-mono text-muted-foreground text-xs">
														{sessionId.substring(0, 20)}...
													</p>
													<span className="font-medium text-green-600 text-xs">
														Running
													</span>
												</div>

												<p className="truncate text-muted-foreground text-xs">
													{session.project_path}
												</p>

												<div className="flex items-center gap-3 text-muted-foreground text-xs">
													<span>
														Started: {formatTimestamp(session.started_at)}
													</span>
													<span>Model: {session.model}</span>
													{session.task && (
														<span
															className="max-w-[200px] truncate"
															title={session.task}
														>
															Task: {session.task}
														</span>
													)}
												</div>
											</div>
										</div>

										<Button size="sm" variant="ghost" className="flex-shrink-0">
											<Play className="mr-1 h-3 w-3" />
											Resume
										</Button>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
};
