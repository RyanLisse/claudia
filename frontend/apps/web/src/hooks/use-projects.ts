"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type Project, type Session } from "@/lib/api";

// Projects query
export function useProjects() {
	return useQuery({
		queryKey: ["projects"],
		queryFn: () => api.getProjects(),
		staleTime: 5 * 60 * 1000, // 5 minutes
		refetchOnWindowFocus: true,
	});
}

// Project sessions query
export function useProjectSessions(projectId: string | null) {
	return useQuery({
		queryKey: ["projects", projectId, "sessions"],
		queryFn: () => api.getProjectSessions(projectId!),
		enabled: !!projectId,
		staleTime: 30 * 1000, // 30 seconds
	});
}

// Session details query
export function useSession(sessionId: string | null) {
	return useQuery({
		queryKey: ["sessions", sessionId],
		queryFn: () => api.getSession(sessionId!),
		enabled: !!sessionId,
		staleTime: 10 * 1000, // 10 seconds
	});
}

// Create session mutation
export function useCreateSession() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			projectPath,
			name,
		}: {
			projectPath: string;
			name?: string;
		}) => api.createSession(projectPath, name),
		onSuccess: (newSession) => {
			// Invalidate projects to refresh session counts
			queryClient.invalidateQueries({ queryKey: ["projects"] });

			// Add the new session to the cache
			queryClient.setQueryData<Session[]>(
				["projects", newSession.project_id, "sessions"],
				(old) => (old ? [newSession, ...old] : [newSession]),
			);
		},
	});
}

// Optimistic project update
export function useOptimisticProjects() {
	const queryClient = useQueryClient();

	const updateProject = (projectId: string, updates: Partial<Project>) => {
		queryClient.setQueryData<Project[]>(
			["projects"],
			(old) =>
				old?.map((project) =>
					project.id === projectId ? { ...project, ...updates } : project,
				) ?? [],
		);
	};

	return { updateProject };
}
