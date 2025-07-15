import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth-store";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Auth Store", () => {
	beforeEach(() => {
		useAuthStore.setState(useAuthStore.getInitialState());
		vi.clearAllMocks();
	});

	describe("Login", () => {
		it("should login successfully", async () => {
			const mockUser = {
				id: "1",
				email: "test@example.com",
				name: "Test User",
				role: "user" as const,
				preferences: {
					theme: "system" as const,
					language: "en",
					notifications: true,
					emailUpdates: false,
				},
			};

			const mockSession = {
				id: "session-1",
				userId: "1",
				expiresAt: new Date(Date.now() + 3600000),
				refreshToken: "refresh-token",
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					user: mockUser,
					session: mockSession,
					permissions: ["read", "write"],
				}),
			});

			const { login } = useAuthStore.getState();

			await login({
				email: "test@example.com",
				password: "password",
			});

			const state = useAuthStore.getState();
			expect(state.user).toEqual(mockUser);
			expect(state.session).toEqual(mockSession);
			expect(state.isAuthenticated).toBe(true);
			expect(state.permissions).toEqual(["read", "write"]);
			expect(state.isLoading).toBe(false);
		});

		it("should handle login failure", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const { login } = useAuthStore.getState();

			await expect(
				login({
					email: "test@example.com",
					password: "wrong-password",
				}),
			).rejects.toThrow("Login failed");

			const state = useAuthStore.getState();
			expect(state.user).toBeNull();
			expect(state.isAuthenticated).toBe(false);
			expect(state.isLoading).toBe(false);
		});

		it("should set loading state during login", async () => {
			let resolveLogin: (value: any) => void;
			const loginPromise = new Promise((resolve) => {
				resolveLogin = resolve;
			});

			mockFetch.mockReturnValueOnce(loginPromise);

			const { login } = useAuthStore.getState();

			const loginAttempt = login({
				email: "test@example.com",
				password: "password",
			});

			// Check loading state
			expect(useAuthStore.getState().isLoading).toBe(true);

			// Resolve the promise
			resolveLogin?.({
				ok: true,
				json: async () => ({
					user: { id: "1", email: "test@example.com" },
					session: { id: "session-1" },
					permissions: [],
				}),
			});

			await loginAttempt;

			expect(useAuthStore.getState().isLoading).toBe(false);
		});
	});

	describe("Logout", () => {
		it("should logout successfully", async () => {
			// Set initial authenticated state
			useAuthStore.setState({
				user: { id: "1", email: "test@example.com" } as any,
				session: { id: "session-1" } as any,
				isAuthenticated: true,
				permissions: ["read"],
				isLoading: false,
			});

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			const { logout } = useAuthStore.getState();

			await logout();

			const state = useAuthStore.getState();
			expect(state.user).toBeNull();
			expect(state.session).toBeNull();
			expect(state.isAuthenticated).toBe(false);
			expect(state.permissions).toEqual([]);
		});

		it("should logout even if API call fails", async () => {
			// Set initial authenticated state
			useAuthStore.setState({
				user: { id: "1", email: "test@example.com" } as any,
				session: { id: "session-1" } as any,
				isAuthenticated: true,
				permissions: ["read"],
				isLoading: false,
			});

			mockFetch.mockRejectedValueOnce(new Error("Network error"));

			const { logout } = useAuthStore.getState();

			await logout();

			const state = useAuthStore.getState();
			expect(state.user).toBeNull();
			expect(state.session).toBeNull();
			expect(state.isAuthenticated).toBe(false);
		});
	});

	describe("Session Refresh", () => {
		it("should refresh session successfully", async () => {
			const originalSession = {
				id: "session-1",
				userId: "1",
				expiresAt: new Date(),
				refreshToken: "refresh-token",
			};

			useAuthStore.setState({
				session: originalSession,
				isAuthenticated: true,
			});

			const newSession = {
				...originalSession,
				id: "session-2",
				expiresAt: new Date(Date.now() + 3600000),
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					session: newSession,
					user: { id: "1", email: "test@example.com" },
					permissions: ["read", "write"],
				}),
			});

			const { refreshSession } = useAuthStore.getState();

			await refreshSession();

			const state = useAuthStore.getState();
			expect(state.session).toEqual(newSession);
			expect(state.permissions).toEqual(["read", "write"]);
		});

		it("should logout on refresh failure", async () => {
			useAuthStore.setState({
				session: { refreshToken: "invalid-token" } as any,
				isAuthenticated: true,
			});

			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
			});

			const logoutSpy = vi.spyOn(useAuthStore.getState(), "logout");

			const { refreshSession } = useAuthStore.getState();

			await refreshSession();

			expect(logoutSpy).toHaveBeenCalled();
		});

		it("should not refresh if no session exists", async () => {
			useAuthStore.setState({
				session: null,
				isAuthenticated: false,
			});

			const { refreshSession } = useAuthStore.getState();

			await refreshSession();

			expect(mockFetch).not.toHaveBeenCalled();
		});
	});

	describe("User Updates", () => {
		beforeEach(() => {
			useAuthStore.setState({
				user: {
					id: "1",
					email: "test@example.com",
					name: "Test User",
					role: "user",
					preferences: {
						theme: "system",
						language: "en",
						notifications: true,
						emailUpdates: false,
					},
				} as any,
				isAuthenticated: true,
			});
		});

		it("should update user successfully", async () => {
			const updates = { name: "Updated Name" };
			const updatedUser = {
				...useAuthStore.getState().user,
				...updates,
			};

			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => updatedUser,
			});

			const { updateUser } = useAuthStore.getState();

			await updateUser(updates);

			expect(useAuthStore.getState().user?.name).toBe("Updated Name");
		});

		it("should update preferences optimistically", async () => {
			const updates = { theme: "dark" as const };

			mockFetch.mockResolvedValueOnce({
				ok: true,
			});

			const { updatePreferences } = useAuthStore.getState();

			// Start the update
			const updatePromise = updatePreferences(updates);

			// Check optimistic update
			expect(useAuthStore.getState().user?.preferences.theme).toBe("dark");

			await updatePromise;

			// Confirm the change persists
			expect(useAuthStore.getState().user?.preferences.theme).toBe("dark");
		});

		it("should revert optimistic update on failure", async () => {
			const originalTheme = useAuthStore.getState().user?.preferences.theme;
			const updates = { theme: "dark" as const };

			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
			});

			const { updatePreferences } = useAuthStore.getState();

			await expect(updatePreferences(updates)).rejects.toThrow();

			// Check that the optimistic update was reverted
			expect(useAuthStore.getState().user?.preferences.theme).toBe(
				originalTheme,
			);
		});
	});

	describe("Store Reset", () => {
		it("should reset store to initial state", () => {
			// Set some state
			useAuthStore.setState({
				user: { id: "1", email: "test@example.com" } as any,
				session: { id: "session-1" } as any,
				isAuthenticated: true,
				permissions: ["read"],
				isLoading: true,
			});

			const { reset } = useAuthStore.getState();
			reset();

			const state = useAuthStore.getState();
			expect(state.user).toBeNull();
			expect(state.session).toBeNull();
			expect(state.isAuthenticated).toBe(false);
			expect(state.permissions).toEqual([]);
			expect(state.isLoading).toBe(false);
		});
	});
});
