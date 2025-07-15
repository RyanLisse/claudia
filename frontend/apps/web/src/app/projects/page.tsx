"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	Calendar,
	ChevronRight,
	Clock,
	FileText,
	FolderOpen,
	Loader2,
	MessageSquare,
	MoreVertical,
	Plus,
	Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Import the appropriate API based on environment
import { api, type Project, type Session } from "@/lib/api-web";
import { cn } from "@/lib/utils";
import { RunningClaudeSessions } from "@/components/RunningClaudeSessions";
// Import React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface ProjectListProps {
	projects: Project[];
	onProjectClick: (project: Project) => void;
	onProjectSettings?: (project: Project) => void;
	loading?: boolean;
	className?: string;
}

interface SessionListProps {
	sessions: Session[];
	projectPath: string;
	onBack: () => void;
	onSessionClick?: (session: Session) => void;
	className?: string;
}

// Utility functions
const getProjectName = (path: string): string => {
	const parts = path.split("/").filter(Boolean);
	return parts[parts.length - 1] || path;
};

const formatTimeAgo = (timestamp: number): string => {
	const now = Date.now();
	const diff = now - timestamp;
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(diff / 3600000);
	const days = Math.floor(diff / 86400000);

	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	return `${days}d ago`;
};

const formatUnixTimestamp = (timestamp: number): string => {
	return new Date(timestamp * 1000).toLocaleString();
};

const formatISOTimestamp = (timestamp: string): string => {
	return new Date(timestamp).toLocaleString();
};

const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + "...";
};

const getFirstLine = (text: string): string => {
	return text.split("\n")[0];
};

// Constants
const PROJECTS_PER_PAGE = 12;
const SESSIONS_PER_PAGE = 5;

// Pagination Component
const Pagination = ({
	currentPage,
	totalPages,
	onPageChange,
}: {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}) => {
	if (totalPages <= 1) return null;

	return (
		<div className="mt-4 flex items-center justify-center space-x-2">
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
			>
				Previous
			</Button>
			<span className="text-muted-foreground text-sm">
				Page {currentPage} of {totalPages}
			</span>
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
			>
				Next
			</Button>
		</div>
	);
};

// Project List Component
const ProjectList = ({
	projects,
	onProjectClick,
	onProjectSettings,
	className,
}: ProjectListProps) => {
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
	const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
	const endIndex = startIndex + PROJECTS_PER_PAGE;
	const currentProjects = projects.slice(startIndex, endIndex);

	useEffect(() => {
		setCurrentPage(1);
	}, [projects.length]);

	return (
		<div className={cn("space-y-4", className)}>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
				{currentProjects.map((project, index) => (
					<motion.div
						key={project.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.3,
							delay: index * 0.05,
							ease: [0.4, 0, 0.2, 1],
						}}
					>
						<Card
							className="group h-full cursor-pointer p-4 transition-all duration-200 hover:shadow-md"
							onClick={() => onProjectClick(project)}
						>
							<div className="flex h-full flex-col">
								<div className="flex-1">
									<div className="mb-2 flex items-start justify-between">
										<div className="flex min-w-0 flex-1 items-center gap-2">
											<FolderOpen className="h-5 w-5 shrink-0 text-primary" />
											<h3 className="truncate font-semibold text-base">
												{getProjectName(project.path)}
											</h3>
										</div>
										{project.sessions.length > 0 && (
											<Badge variant="secondary" className="ml-2 shrink-0">
												{project.sessions.length}
											</Badge>
										)}
									</div>

									<p className="mb-3 truncate font-mono text-muted-foreground text-sm">
										{project.path}
									</p>
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3 text-muted-foreground text-xs">
										<div className="flex items-center gap-1">
											<Calendar className="h-3 w-3" />
											<span>{formatTimeAgo(project.created_at * 1000)}</span>
										</div>
										<div className="flex items-center gap-1">
											<FileText className="h-3 w-3" />
											<span>{project.sessions.length}</span>
										</div>
									</div>

									<div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
										{onProjectSettings && (
											<DropdownMenu>
												<DropdownMenuTrigger
													asChild
													onClick={(e) => e.stopPropagation()}
												>
													<Button
														variant="ghost"
														size="sm"
														className="h-8 w-8 p-0"
													>
														<MoreVertical className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem
														onClick={(e) => {
															e.stopPropagation();
															onProjectSettings(project);
														}}
													>
														<Settings className="mr-2 h-4 w-4" />
														Settings
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										)}
										<ChevronRight className="h-4 w-4 text-muted-foreground" />
									</div>
								</div>
							</div>
						</Card>
					</motion.div>
				))}
			</div>

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
			/>
		</div>
	);
};

// Session List Component
const SessionList = ({
	sessions,
	projectPath,
	onBack,
	onSessionClick,
	className,
}: SessionListProps) => {
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE);
	const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
	const endIndex = startIndex + SESSIONS_PER_PAGE;
	const currentSessions = sessions.slice(startIndex, endIndex);

	useEffect(() => {
		setCurrentPage(1);
	}, [sessions.length]);

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
																{session.first_message_at
																	? formatISOTimestamp(
																			new Date(
																				session.first_message_at * 1000,
																			).toISOString(),
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

			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				onPageChange={setCurrentPage}
			/>
		</div>
	);
};

// Running Claude Sessions Wrapper Component
const RunningClaudeSessionsWrapper = () => {
	const handleSessionClick = (session: Session) => {
		// Navigate to session or handle session click
		console.log("Session clicked:", session);
	};

	return (
		<div className="mb-6">
			<RunningClaudeSessions onSessionClick={handleSessionClick} />
		</div>
	);
};

// Main Projects Page Component
export default function ProjectsPage() {
	const [selectedProject, setSelectedProject] = useState<Project | null>(null);
	const [projects, setProjects] = useState<Project[]>([]);
	const [sessions, setSessions] = useState<Session[]>([]);
	const [projectsLoading, setProjectsLoading] = useState(true);
	const [sessionsLoading, setSessionsLoading] = useState(false);
	const [projectsError, setProjectsError] = useState<Error | null>(null);
	const [sessionsError, setSessionsError] = useState<Error | null>(null);

	// Load projects on component mount
	useEffect(() => {
		const loadProjects = async () => {
			try {
				setProjectsLoading(true);
				setProjectsError(null);
				const projectsData = await api.getProjects();
				setProjects(projectsData);
			} catch (error) {
				setProjectsError(error instanceof Error ? error : new Error('Failed to load projects'));
			} finally {
				setProjectsLoading(false);
			}
		};

		loadProjects();
	}, []);

	// Load sessions when a project is selected
	useEffect(() => {
		const loadSessions = async () => {
			if (!selectedProject) {
				setSessions([]);
				return;
			}

			try {
				setSessionsLoading(true);
				setSessionsError(null);
				const sessionsData = await api.getProjectSessions(selectedProject.id);
				setSessions(sessionsData);
			} catch (error) {
				setSessionsError(error instanceof Error ? error : new Error('Failed to load sessions'));
			} finally {
				setSessionsLoading(false);
			}
		};

		loadSessions();
	}, [selectedProject]);

	const handleProjectClick = (project: Project) => {
		setSelectedProject(project);
	};

	const handleBack = () => {
		setSelectedProject(null);
	};

	const handleNewSession = async () => {
		try {
			// In a real implementation, this would open a dialog to select project path
			// For now, we'll create a session for the current working directory
			const newSession = await api.createSession(process.cwd() || "/", "New Claude Code session");
			
			// Emit event to navigate to the new session
			const event = new CustomEvent("claude-session-selected", {
				detail: { session: newSession, projectPath: newSession.project_path },
			});
			window.dispatchEvent(event);
			
			// Refresh projects list to show the new session
			const projectsData = await api.getProjects();
			setProjects(projectsData);
		} catch (error) {
			console.error("Failed to create new session:", error);
			// For web deployment, just navigate to home
			window.location.href = "/";
		}
	};

	const handleProjectSettings = (project: Project) => {
		// For now, just show an alert. In a full implementation, this would open a settings modal
		alert(`Settings for project: ${project.path}`);
	};

	const handleSessionClick = (session: Session) => {
		// Emit event to navigate to the session
		const event = new CustomEvent("claude-session-selected", {
			detail: { session, projectPath: session.project_path },
		});
		window.dispatchEvent(event);
		
		// In a real implementation, this would navigate to the session view
		// For now, we'll show a notification that the session was selected
		console.log("Session selected:", session);
		
		// You could also navigate to a dedicated session page:
		// window.location.href = `/sessions/${session.id}`;
	};

	// Compute loading and error states
	const loading = projectsLoading || sessionsLoading;
	const error = projectsError || sessionsError;

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto p-6">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className="mb-6"
				>
					<button
						onClick={() => (window.location.href = "/")}
						className="mb-4 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						← Back to Home
					</button>
					<div className="mb-4">
						<h1 className="font-bold text-3xl tracking-tight">CC Projects</h1>
						<p className="mt-1 text-muted-foreground text-sm">
							Browse your Claude Code sessions
						</p>
					</div>
				</motion.div>

				{/* Error display */}
				{error && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="mb-4 max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-xs"
					>
						{error instanceof Error ? error.message : "An error occurred"}
					</motion.div>
				)}

				{/* Loading state */}
				{loading && (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				)}

				{/* Content */}
				{!loading && (
					<AnimatePresence mode="wait">
						{selectedProject ? (
							<motion.div
								key="sessions"
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.3 }}
							>
								<SessionList
									sessions={sessions}
									projectPath={selectedProject.path}
									onBack={handleBack}
									onSessionClick={handleSessionClick}
								/>
							</motion.div>
						) : (
							<motion.div
								key="projects"
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: 20 }}
								transition={{ duration: 0.3 }}
							>
								{/* New session button */}
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5 }}
									className="mb-4"
								>
									<Button
										onClick={handleNewSession}
										size="default"
										className="w-full max-w-md"
									>
										<Plus className="mr-2 h-4 w-4" />
										New Claude Code session
									</Button>
								</motion.div>

								{/* Running Claude Sessions */}
								<RunningClaudeSessionsWrapper />

								{/* Project list */}
								{projects.length > 0 ? (
									<ProjectList
										projects={projects}
										onProjectClick={handleProjectClick}
										onProjectSettings={handleProjectSettings}
										className="animate-fade-in"
									/>
								) : (
									<div className="py-8 text-center">
										<p className="text-muted-foreground text-sm">
											No projects found in ~/.claude/projects
										</p>
									</div>
								)}
							</motion.div>
						)}
					</AnimatePresence>
				)}
			</div>
		</div>
	);
}
