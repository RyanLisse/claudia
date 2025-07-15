import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Agent, AgentSession, AppActions, AppState } from "./types";

interface AppStore extends AppState, AppActions {
	reset: () => void;
}

const initialState: AppState = {
	currentProject: null,
	projects: [],
	agents: [],
	sessions: [],
	activeSession: null,
	workspaceSettings: {
		autoSave: true,
		autoFormat: true,
		gitIntegration: true,
		aiAssistance: true,
		collaborationMode: false,
	},
};

export const useAppStore = create<AppStore>()(
	devtools(
		persist(
			(set, get) => ({
				...initialState,

				// Project actions
				setCurrentProject: (project) => {
					set((state) => ({
						...state,
						currentProject: project,
					}));
				},

				addProject: async (projectData) => {
					// TODO: Replace with actual API call
					const response = await fetch("/api/projects", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(projectData),
					});

					if (!response.ok) {
						throw new Error("Failed to create project");
					}

					const newProject = await response.json();

					set((state) => ({
						...state,
						projects: [...state.projects, newProject],
					}));
				},

				updateProject: async (id, updates) => {
					// Optimistic update
					set((state) => {
						const projectIndex = state.projects.findIndex((p) => p.id === id);
						if (projectIndex !== -1) {
							state.projects[projectIndex] = {
								...state.projects[projectIndex],
								...updates,
							};
						}
						if (state.currentProject?.id === id) {
							state.currentProject = { ...state.currentProject, ...updates };
						}
					});

					// TODO: Replace with actual API call
					const response = await fetch(`/api/projects/${id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(updates),
					});

					if (!response.ok) {
						// Revert optimistic update
						const { projects, currentProject } = get();
						set((state) => {
							state.projects = projects;
							state.currentProject = currentProject;
						});
						throw new Error("Failed to update project");
					}
				},

				deleteProject: async (id) => {
					// TODO: Replace with actual API call
					const response = await fetch(`/api/projects/${id}`, {
						method: "DELETE",
					});

					if (!response.ok) {
						throw new Error("Failed to delete project");
					}

					set((state) => {
						state.projects = state.projects.filter((p) => p.id !== id);
						if (state.currentProject?.id === id) {
							state.currentProject = null;
						}
					});
				},

				// Agent actions
				addAgent: (agentData) => {
					const newAgent: Agent = {
						id: `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						...agentData,
						performance: {
							tasksCompleted: 0,
							averageTime: 0,
							successRate: 0,
							lastActive: new Date(),
						},
					};

					set((state) => {
						state.agents.push(newAgent);
					});
				},

				updateAgent: (id, updates) => {
					set((state) => {
						const agentIndex = state.agents.findIndex((a) => a.id === id);
						if (agentIndex !== -1) {
							state.agents[agentIndex] = {
								...state.agents[agentIndex],
								...updates,
							};
						}
					});
				},

				removeAgent: (id) => {
					set((state) => {
						state.agents = state.agents.filter((a) => a.id !== id);
						// Also remove related sessions
						state.sessions = state.sessions.filter((s) => s.agentId !== id);
						if (state.activeSession) {
							const activeSession = state.sessions.find(
								(s) => s.id === state.activeSession,
							);
							if (activeSession?.agentId === id) {
								state.activeSession = null;
							}
						}
					});
				},

				// Session actions
				startSession: async (agentId, projectId) => {
					const newSession: AgentSession = {
						id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						agentId,
						projectId,
						status: "running",
						startedAt: new Date(),
						logs: [],
						metrics: {
							duration: 0,
							tasksCompleted: 0,
							linesOfCode: 0,
							filesModified: 0,
							testsPassed: 0,
							testsFailed: 0,
						},
					};

					set((state) => {
						state.sessions.push(newSession);
						state.activeSession = newSession.id;
					});

					// TODO: Replace with actual API call to start session
					// await fetch('/api/sessions', {
					//   method: 'POST',
					//   headers: { 'Content-Type': 'application/json' },
					//   body: JSON.stringify({ agentId, projectId }),
					// });

					return newSession.id;
				},

				stopSession: async (sessionId) => {
					set((state) => {
						const sessionIndex = state.sessions.findIndex(
							(s) => s.id === sessionId,
						);
						if (sessionIndex !== -1) {
							state.sessions[sessionIndex].status = "completed";
							state.sessions[sessionIndex].completedAt = new Date();
						}
						if (state.activeSession === sessionId) {
							state.activeSession = null;
						}
					});
				},

				setActiveSession: (sessionId) => {
					set((state) => {
						state.activeSession = sessionId;
					});
				},

				// Workspace settings
				updateWorkspaceSettings: (settings) => {
					set((state) => {
						state.workspaceSettings = {
							...state.workspaceSettings,
							...settings,
						};
					});
				},

				// Reset to initial state
				reset: () => {
					set(initialState);
				},
			}),
			{
				name: "app-store",
				partialize: (state) => ({
					currentProject: state.currentProject,
					projects: state.projects,
					workspaceSettings: state.workspaceSettings,
				}),
			},
		),
		{ name: "App Store" },
	),
);
