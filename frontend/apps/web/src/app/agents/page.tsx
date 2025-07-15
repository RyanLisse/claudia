"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowLeft,
	Bot,
	ChevronDown,
	Download,
	Edit,
	FileJson,
	Globe,
	History,
	Loader2,
	MoreVertical,
	Play,
	Plus,
	Trash2,
	Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// Import the appropriate API based on environment
import { api, type Agent, type AgentRunWithMetrics } from "@/lib/api-web";
import { cn } from "@/lib/utils";

// Icon mapping (using Lucide React icons)
const AGENT_ICONS = {
	bot: Bot,
	// Add more icons as needed
};

type AgentIconName = keyof typeof AGENT_ICONS;

// Utility functions
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

const formatDate = (timestamp: string): string => {
	return new Date(timestamp).toLocaleDateString();
};

const truncateText = (text: string, maxLength: number): string => {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + "...";
};

// Constants
const AGENTS_PER_PAGE = 9; // 3x3 grid
const RUNS_PER_PAGE = 5;

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

// Agent Runs List Component
const AgentRunsList = ({ runs }: { runs: AgentRunWithMetrics[] }) => {
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.ceil(runs.length / RUNS_PER_PAGE);
	const startIndex = (currentPage - 1) * RUNS_PER_PAGE;
	const endIndex = startIndex + RUNS_PER_PAGE;
	const currentRuns = runs.slice(startIndex, endIndex);

	useEffect(() => {
		setCurrentPage(1);
	}, [runs.length]);

	if (runs.length === 0) {
		return (
			<div className="py-8 text-center">
				<p className="text-muted-foreground text-sm">No agent executions yet</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				{currentRuns.map((run, index) => (
					<motion.div
						key={run.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.3, delay: index * 0.05 }}
					>
						<Card className="p-3 transition-shadow hover:shadow-md">
							<div className="flex items-center justify-between">
								<div className="flex min-w-0 flex-1 items-center gap-3">
									<div className="flex items-center gap-2">
										<Bot className="h-4 w-4 text-muted-foreground" />
										<span className="font-medium text-sm">
											{run.agent_name}
										</span>
									</div>
									<Badge variant="secondary" className="text-xs">
										{run.status || "completed"}
									</Badge>
								</div>
								<div className="text-muted-foreground text-xs">
									{run.created_at ? formatDate(run.created_at) : "Unknown"}
								</div>
							</div>
							{run.project_path && (
								<p className="mt-2 font-mono text-muted-foreground text-xs">
									{run.project_path}
								</p>
							)}
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

// Create Agent Modal Component
const CreateAgentModal = ({
	isOpen,
	onClose,
	onAgentCreated,
	agent,
}: {
	isOpen: boolean;
	onClose: () => void;
	onAgentCreated: () => void;
	agent?: Agent | null;
}) => {
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		system_prompt: "",
		icon: "bot" as AgentIconName,
	});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (agent) {
			setFormData({
				name: agent.name,
				description: agent.description,
				system_prompt: agent.system_prompt,
				icon: (agent.icon as AgentIconName) || "bot",
			});
		} else {
			setFormData({
				name: "",
				description: "",
				system_prompt: "",
				icon: "bot",
			});
		}
		setError(null);
	}, [agent, isOpen]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) {
			setError("Name is required");
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			if (agent?.id) {
				await api.updateAgent(
					agent.id,
					formData.name,
					formData.icon,
					formData.system_prompt,
					formData.description,
					"sonnet" // default model
				);
			} else {
				await api.createAgent(
					formData.name,
					formData.icon,
					formData.system_prompt,
					formData.description,
					"sonnet" // default model
				);
			}

			onAgentCreated();
			onClose();
		} catch (err) {
			console.error("Failed to save agent:", err);
			setError(err instanceof Error ? err.message : "Failed to save agent");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{agent ? "Edit Agent" : "Create New Agent"}</DialogTitle>
					<DialogDescription>
						{agent
							? "Update your agent configuration"
							: "Create a new Claude Code agent with custom instructions"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{error && (
						<div className="rounded bg-destructive/10 p-2 text-destructive text-sm">
							{error}
						</div>
					)}

					<div>
						<label className="mb-1 block font-medium text-sm">Name</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData((prev) => ({ ...prev, name: e.target.value }))
							}
							className="w-full rounded-md border p-2 text-sm"
							placeholder="Enter agent name"
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label className="mb-1 block font-medium text-sm">
							Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									description: e.target.value,
								}))
							}
							className="h-16 w-full resize-none rounded-md border p-2 text-sm"
							placeholder="Brief description of what this agent does"
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label className="mb-1 block font-medium text-sm">
							System Prompt
						</label>
						<textarea
							value={formData.system_prompt}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									system_prompt: e.target.value,
								}))
							}
							className="h-24 w-full resize-none rounded-md border p-2 text-sm"
							placeholder="Enter the system prompt for this agent"
							disabled={isSubmitting}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isSubmitting}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{agent ? "Updating..." : "Creating..."}
								</>
							) : agent ? (
								"Update Agent"
							) : (
								"Create Agent"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};

// Agent Execution Modal Component
const AgentExecutionModal = ({
	isOpen,
	onClose,
	agent,
	onExecutionComplete,
}: {
	isOpen: boolean;
	onClose: () => void;
	agent: Agent | null;
	onExecutionComplete: () => Promise<void>;
}) => {
	const [projectPath, setProjectPath] = useState("");
	const [isExecuting, setIsExecuting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleExecute = async () => {
		if (!agent?.id || !projectPath.trim()) {
			setError("Project path is required");
			return;
		}

		try {
			setIsExecuting(true);
			setError(null);

			// Execute the agent with the required task parameter
			await api.executeAgent(
				agent.id, 
				projectPath, 
				agent.default_task || "Execute agent task",
				agent.model || "sonnet"
			);
			
			// Refresh the runs list after successful execution
			await onExecutionComplete();
			onClose();
		} catch (err) {
			console.error("Failed to execute agent:", err);
			setError(err instanceof Error ? err.message : "Failed to execute agent");
		} finally {
			setIsExecuting(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Execute Agent</DialogTitle>
					<DialogDescription>
						Execute "{agent?.name}" on a project
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{error && (
						<div className="rounded bg-destructive/10 p-2 text-destructive text-sm">
							{error}
						</div>
					)}

					<div>
						<label className="mb-1 block font-medium text-sm">
							Project Path
						</label>
						<input
							type="text"
							value={projectPath}
							onChange={(e) => setProjectPath(e.target.value)}
							className="w-full rounded-md border p-2 text-sm"
							placeholder="Enter project path"
							disabled={isExecuting}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isExecuting}
						>
							Cancel
						</Button>
						<Button
							onClick={handleExecute}
							disabled={isExecuting || !projectPath.trim()}
						>
							{isExecuting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Executing...
								</>
							) : (
								<>
									<Play className="mr-2 h-4 w-4" />
									Execute Agent
								</>
							)}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
};

// Main CC Agents Page Component
export default function AgentsPage() {
	const [agents, setAgents] = useState<Agent[]>([]);
	const [runs, setRuns] = useState<AgentRunWithMetrics[]>([]);
	const [loading, setLoading] = useState(true);
	const [runsLoading, setRunsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [showExecuteModal, setShowExecuteModal] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Load agents on mount
	useEffect(() => {
		loadAgents();
		loadRuns();
	}, []);

	const loadAgents = async () => {
		try {
			setLoading(true);
			setError(null);
			const agentsList = await api.listAgents();
			setAgents(agentsList);
		} catch (err) {
			console.error("Failed to load agents:", err);
			setError("Failed to load agents");
		} finally {
			setLoading(false);
		}
	};

	const loadRuns = async () => {
		try {
			setRunsLoading(true);
			const runsList = await api.listAgentRuns();
			setRuns(runsList);
		} catch (err) {
			console.error("Failed to load runs:", err);
		} finally {
			setRunsLoading(false);
		}
	};

	const handleDeleteAgent = (agent: Agent) => {
		setAgentToDelete(agent);
		setShowDeleteDialog(true);
	};

	const confirmDeleteAgent = async () => {
		if (!agentToDelete?.id) return;

		try {
			setIsDeleting(true);
			await api.deleteAgent(agentToDelete.id);
			await loadAgents();
			await loadRuns();
		} catch (err) {
			console.error("Failed to delete agent:", err);
			setError("Failed to delete agent");
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
			setAgentToDelete(null);
		}
	};

	const handleEditAgent = (agent: Agent) => {
		setSelectedAgent(agent);
		setShowCreateModal(true);
	};

	const handleExecuteAgent = (agent: Agent) => {
		setSelectedAgent(agent);
		setShowExecuteModal(true);
	};

	const handleExportAgent = async (agent: Agent) => {
		try {
			// In a real Tauri app, this would use the native file dialog
			// For now, we'll create a download link
			const agentData = {
				name: agent.name,
				description: agent.description,
				system_prompt: agent.system_prompt,
				icon: agent.icon,
			};

			const blob = new Blob([JSON.stringify(agentData, null, 2)], {
				type: "application/json",
			});
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${agent.name.toLowerCase().replace(/\s+/g, "-")}.claudia.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			console.error("Failed to export agent:", err);
			setError("Failed to export agent");
		}
	};

	const handleImportAgent = async () => {
		try {
			// In a real Tauri app, this would use the native file dialog
			// For now, we'll use the HTML file input
			const input = document.createElement("input");
			input.type = "file";
			input.accept = ".json,.claudia.json";
			input.onchange = async (e) => {
				const file = (e.target as HTMLInputElement).files?.[0];
				if (file) {
					try {
						const text = await file.text();
						const agentData = JSON.parse(text);

						await api.createAgent(
							agentData.name,
							agentData.icon || "bot",
							agentData.system_prompt,
							agentData.description,
							"sonnet" // default model
						);

						await loadAgents();
					} catch (err) {
						console.error("Failed to import agent:", err);
						setError("Failed to import agent");
					}
				}
			};
			input.click();
		} catch (err) {
			console.error("Failed to import agent:", err);
			setError("Failed to import agent");
		}
	};

	const handleAgentCreated = async () => {
		await loadAgents();
		setShowCreateModal(false);
		setSelectedAgent(null);
	};

	const handleExecutionComplete = async () => {
		await loadRuns();
		setShowExecuteModal(false);
		setSelectedAgent(null);
	};

	// Pagination calculations
	const totalPages = Math.ceil(agents.length / AGENTS_PER_PAGE);
	const startIndex = (currentPage - 1) * AGENTS_PER_PAGE;
	const paginatedAgents = agents.slice(
		startIndex,
		startIndex + AGENTS_PER_PAGE,
	);

	const renderIcon = (iconName: string) => {
		const Icon = AGENT_ICONS[iconName as AgentIconName] || AGENT_ICONS.bot;
		return <Icon className="h-12 w-12" />;
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto p-6">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
					className="mb-6"
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<button
								onClick={() => (window.location.href = "/")}
								className="text-muted-foreground transition-colors hover:text-foreground"
							>
								<ArrowLeft className="h-5 w-5" />
							</button>
							<div>
								<h1 className="font-bold text-3xl tracking-tight">CC Agents</h1>
								<p className="text-muted-foreground text-sm">
									Manage your custom AI agents
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										size="default"
										variant="outline"
										className="flex items-center gap-2"
									>
										<Download className="h-4 w-4" />
										Import
										<ChevronDown className="h-3 w-3" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end">
									<DropdownMenuItem onClick={handleImportAgent}>
										<FileJson className="mr-2 h-4 w-4" />
										From File
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => alert("GitHub import coming soon")}
									>
										<Globe className="mr-2 h-4 w-4" />
										From GitHub
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
							<Button
								onClick={() => setShowCreateModal(true)}
								size="default"
								className="flex items-center gap-2"
							>
								<Plus className="h-4 w-4" />
								Create Agent
							</Button>
						</div>
					</div>
				</motion.div>

				{/* Error display */}
				{error && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-sm"
					>
						{error}
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
					<div className="space-y-8">
						{/* Agents Grid */}
						<div>
							{agents.length === 0 ? (
								<div className="flex h-64 flex-col items-center justify-center text-center">
									<Bot className="mb-4 h-16 w-16 text-muted-foreground" />
									<h3 className="mb-2 font-medium text-lg">No agents yet</h3>
									<p className="mb-4 text-muted-foreground text-sm">
										Create your first CC Agent to get started
									</p>
									<Button
										onClick={() => setShowCreateModal(true)}
										size="default"
									>
										<Plus className="mr-2 h-4 w-4" />
										Create Agent
									</Button>
								</div>
							) : (
								<>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
										<AnimatePresence mode="popLayout">
											{paginatedAgents.map((agent, index) => (
												<motion.div
													key={agent.id}
													initial={{ opacity: 0, scale: 0.9 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.9 }}
													transition={{ duration: 0.2, delay: index * 0.05 }}
												>
													<Card className="h-full transition-shadow hover:shadow-lg">
														<CardContent className="flex flex-col items-center p-6 text-center">
															<div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
																{renderIcon(agent.icon)}
															</div>
															<h3 className="mb-2 font-semibold text-lg">
																{agent.name}
															</h3>
															<p className="mb-2 text-muted-foreground text-sm">
																{truncateText(agent.description, 100)}
															</p>
															<p className="text-muted-foreground text-xs">
																Created: {formatDate(agent.created_at)}
															</p>
														</CardContent>
														<CardFooter className="flex flex-wrap justify-center gap-1 p-4 pt-0">
															<Button
																size="sm"
																variant="ghost"
																onClick={() => handleExecuteAgent(agent)}
																className="flex items-center gap-1"
																title="Execute agent"
															>
																<Play className="h-3 w-3" />
																Execute
															</Button>
															<Button
																size="sm"
																variant="ghost"
																onClick={() => handleEditAgent(agent)}
																className="flex items-center gap-1"
																title="Edit agent"
															>
																<Edit className="h-3 w-3" />
																Edit
															</Button>
															<DropdownMenu>
																<DropdownMenuTrigger asChild>
																	<Button
																		size="sm"
																		variant="ghost"
																		className="flex items-center gap-1"
																		title="More options"
																	>
																		<MoreVertical className="h-3 w-3" />
																	</Button>
																</DropdownMenuTrigger>
																<DropdownMenuContent align="end">
																	<DropdownMenuItem
																		onClick={() => handleExportAgent(agent)}
																	>
																		<Upload className="mr-2 h-4 w-4" />
																		Export
																	</DropdownMenuItem>
																	<DropdownMenuItem
																		onClick={() => handleDeleteAgent(agent)}
																		className="text-destructive"
																	>
																		<Trash2 className="mr-2 h-4 w-4" />
																		Delete
																	</DropdownMenuItem>
																</DropdownMenuContent>
															</DropdownMenu>
														</CardFooter>
													</Card>
												</motion.div>
											))}
										</AnimatePresence>
									</div>

									{/* Pagination */}
									<Pagination
										currentPage={currentPage}
										totalPages={totalPages}
										onPageChange={setCurrentPage}
									/>
								</>
							)}
						</div>

						{/* Execution History */}
						{!loading && agents.length > 0 && (
							<div className="overflow-hidden">
								<div className="mb-4 flex items-center gap-2">
									<History className="h-5 w-5 text-muted-foreground" />
									<h2 className="font-semibold text-lg">Recent Executions</h2>
								</div>
								{runsLoading ? (
									<div className="flex h-32 items-center justify-center">
										<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
									</div>
								) : (
									<AgentRunsList runs={runs} />
								)}
							</div>
						)}
					</div>
				)}
			</div>

			{/* Create/Edit Agent Modal */}
			<CreateAgentModal
				isOpen={showCreateModal}
				onClose={() => {
					setShowCreateModal(false);
					setSelectedAgent(null);
				}}
				onAgentCreated={handleAgentCreated}
				agent={selectedAgent}
			/>

			{/* Execute Agent Modal */}
			<AgentExecutionModal
				isOpen={showExecuteModal}
				onClose={() => {
					setShowExecuteModal(false);
					setSelectedAgent(null);
				}}
				agent={selectedAgent}
				onExecutionComplete={loadRuns}
			/>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-destructive" />
							Delete Agent
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete the agent "{agentToDelete?.name}"?
							This action cannot be undone and will permanently remove the agent
							and all its associated data.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
							disabled={isDeleting}
							className="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDeleteAgent}
							disabled={isDeleting}
							className="w-full sm:w-auto"
						>
							{isDeleting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete Agent
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
