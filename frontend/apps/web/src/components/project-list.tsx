"use client";

import { motion } from "framer-motion";
import {
	Calendar,
	ChevronRight,
	FileText,
	FolderOpen,
	MoreVertical,
	Settings,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Pagination } from "./ui/pagination";

// Types adapted for Next.js
export interface Project {
	id: string;
	path: string;
	sessions: string[];
	created_at: number;
}

interface ProjectListProps {
	/**
	 * Array of projects to display
	 */
	projects: Project[];
	/**
	 * Callback when a project is clicked
	 */
	onProjectClick: (project: Project) => void;
	/**
	 * Callback when hooks configuration is clicked
	 */
	onProjectSettings?: (project: Project) => void;
	/**
	 * Whether the list is currently loading
	 */
	loading?: boolean;
	/**
	 * Optional className for styling
	 */
	className?: string;
}

const ITEMS_PER_PAGE = 12;

/**
 * Format time ago from timestamp
 */
function formatTimeAgo(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ago`;
	if (hours > 0) return `${hours}h ago`;
	if (minutes > 0) return `${minutes}m ago`;
	return "Just now";
}

/**
 * Extracts the project name from the full path
 */
const getProjectName = (path: string): string => {
	const parts = path.split("/").filter(Boolean);
	return parts[parts.length - 1] || path;
};

/**
 * ProjectList component - Displays a paginated list of projects with hover animations
 *
 * @example
 * <ProjectList
 *   projects={projects}
 *   onProjectClick={(project) => console.log('Selected:', project)}
 * />
 */
export const ProjectList: React.FC<ProjectListProps> = ({
	projects,
	onProjectClick,
	onProjectSettings,
	loading = false,
	className,
}) => {
	const [currentPage, setCurrentPage] = useState(1);

	// Calculate pagination
	const totalPages = Math.ceil(projects.length / ITEMS_PER_PAGE);
	const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
	const endIndex = startIndex + ITEMS_PER_PAGE;
	const currentProjects = projects.slice(startIndex, endIndex);

	// Reset to page 1 if projects change
	React.useEffect(() => {
		setCurrentPage(1);
	}, []);

	if (loading) {
		return (
			<div className={cn("space-y-4", className)}>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
					{Array.from({ length: 6 }).map((_, i) => (
						<Card key={i} className="h-32 p-4">
							<div className="animate-pulse space-y-3">
								<div className="h-4 w-3/4 rounded bg-muted" />
								<div className="h-3 w-1/2 rounded bg-muted" />
								<div className="h-3 w-1/4 rounded bg-muted" />
							</div>
						</Card>
					))}
				</div>
			</div>
		);
	}

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
														Hooks
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
