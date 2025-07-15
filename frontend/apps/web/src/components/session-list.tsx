"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	Calendar,
	Clock,
	FileText,
	MessageSquare,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Pagination } from "./ui/pagination";

// Types adapted for Next.js
export interface Session {
	id: string;
	project_id: string;
	project_path: string;
	todo_data?: any;
	created_at: number;
	first_message?: string;
	message_timestamp?: string;
}

export interface ClaudeMdFile {
	relative_path: string;
	absolute_path: string;
	size: number;
	modified: number;
}

interface SessionListProps {
	/**
	 * Array of sessions to display
	 */
	sessions: Session[];
	/**
	 * The current project path being viewed
	 */
	projectPath: string;
	/**
	 * Callback to go back to project list
	 */
	onBack: () => void;
	/**
	 * Callback when a session is clicked
	 */
	onSessionClick?: (session: Session) => void;
	/**
	 * Callback when a CLAUDE.md file should be edited
	 */
	onEditClaudeFile?: (file: ClaudeMdFile) => void;
	/**
	 * Optional className for styling
	 */
	className?: string;
}

const ITEMS_PER_PAGE = 5;

/**
 * Format Unix timestamp to readable string
 */
function formatUnixTimestamp(timestamp: number): string {
	return new Date(timestamp * 1000).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Format ISO timestamp to readable string
 */
function formatISOTimestamp(timestamp: string): string {
	return new Date(timestamp).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Truncate text to specified length
 */
function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.substring(0, maxLength)}...`;
}

/**
 * Get first line of text
 */
function getFirstLine(text: string): string {
	return text.split("\n")[0];
}

/**
 * SessionList component - Displays paginated sessions for a specific project
 *
 * @example
 * <SessionList
 *   sessions={sessions}
 *   projectPath="/Users/example/project"
 *   onBack={() => setSelectedProject(null)}
 *   onSessionClick={(session) => console.log('Selected session:', session)}
 * />
 */
export const SessionList: React.FC<SessionListProps> = ({
	sessions,
	projectPath,
	onBack,
	onSessionClick,
	onEditClaudeFile,
	className,
}) => {
	const [currentPage, setCurrentPage] = useState(1);

	// Calculate pagination
	const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentSessions = sessions.slice(startIndex, endIndex);

	// Reset to page 1 if sessions change
	React.useEffect(() => {
		setCurrentPage(1);
	}, []);

	return (
		<div className={cn("space-y-4", className)}>
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ duration: 0.3 }}
				className="flex items-center space-x-3"
			>
				<Button
					variant="ghost"
					size="icon"
					onClick={onBack}
					className="h-8 w-8"
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div className="min-w-0 flex-1">
					<h2 className="truncate font-medium text-base">{projectPath}</h2>
					<p className="text-muted-foreground text-xs">
						{sessions.length} session{sessions.length !== 1 ? "s" : ""}
					</p>
				</div>
			</motion.div>

			<AnimatePresence mode="popLayout">
				<div className="space-y-2">
					{currentSessions.map((session, index) => (
						<motion.div
							key={session.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -20 }}
							transition={{
								duration: 0.3,
								delay: index * 0.05,
								ease: [0.4, 0, 0.2, 1],
							}}
						>
							<Card
								className={cn(
									"cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99]",
									session.todo_data && "border-l-4 border-l-primary",
								)}
								onClick={() => {
									// Emit a special event for Claude Code session navigation
									const event = new CustomEvent("claude-session-selected", {
										detail: { session, projectPath },
									});
									window.dispatchEvent(event);
									onSessionClick?.(session);
								}}
							>
								<CardContent className="p-3">
									<div className="space-y-2">
										<div className="flex items-start justify-between">
											<div className="flex min-w-0 flex-1 items-start space-x-3">
												<FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
												<div className="min-w-0 flex-1 space-y-1">
													<p className="font-mono text-muted-foreground text-xs">
														{session.id}
													</p>

													{/* First message preview */}
													{session.first_message && (
														<div className="space-y-1">
															<div className="flex items-center space-x-1 text-muted-foreground text-xs">
																<MessageSquare className="h-3 w-3" />
																<span>First message:</span>
															</div>
															<p className="line-clamp-2 text-foreground/80 text-xs">
																{truncateText(
																	getFirstLine(session.first_message),
																	100,
																)}
															</p>
														</div>
													)}

													{/* Metadata */}
													<div className="flex items-center space-x-3 text-muted-foreground text-xs">
														{/* Message timestamp if available, otherwise file creation time */}
														<div className="flex items-center space-x-1">
															<Clock className="h-3 w-3" />
															<span>
																{session.message_timestamp
																	? formatISOTimestamp(
																			session.message_timestamp,
																		)
																	: formatUnixTimestamp(session.created_at)}
															</span>
														</div>

														{session.todo_data && (
															<div className="flex items-center space-x-1">
																<Calendar className="h-3 w-3" />
																<span>Has todo</span>
															</div>
														)}
													</div>
												</div>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</motion.div>
					))}
				</div>
			</AnimatePresence>

			{totalPages > 1 && (
				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					onPageChange={setCurrentPage}
				/>
			)}
		</div>
	);
};
