import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "@/stores/ui-store";

// Mock localStorage for persist middleware
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
	value: localStorageMock,
});

describe("UI Store", () => {
	beforeEach(() => {
		// Reset store state before each test
		useUIStore.setState(useUIStore.getInitialState());
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllTimers();
	});

	describe("Theme Management", () => {
		it("should set theme correctly", () => {
			const { setTheme } = useUIStore.getState();

			setTheme("dark");

			expect(useUIStore.getState().theme).toBe("dark");
		});

		it.skip("should persist theme setting", async () => {
			const { setTheme } = useUIStore.getState();

			setTheme("light");

			// Wait for next tick to allow persist middleware to run
			await new Promise((resolve) => setTimeout(resolve, 0));

			// Check if localStorage.setItem was called (persist middleware)
			expect(localStorageMock.setItem).toHaveBeenCalled();
		});
	});

	describe("Sidebar Management", () => {
		it("should toggle sidebar state", () => {
			const { toggleSidebar } = useUIStore.getState();
			const initialState = useUIStore.getState().sidebarOpen;

			toggleSidebar();

			expect(useUIStore.getState().sidebarOpen).toBe(!initialState);
		});

		it("should toggle sidebar multiple times", () => {
			const { toggleSidebar } = useUIStore.getState();
			const initialState = useUIStore.getState().sidebarOpen;

			toggleSidebar();
			toggleSidebar();

			expect(useUIStore.getState().sidebarOpen).toBe(initialState);
		});
	});

	describe("Modal Management", () => {
		it("should open modal correctly", () => {
			const { openModal } = useUIStore.getState();

			openModal("settings");

			expect(useUIStore.getState().modals.settings).toBe(true);
			expect(useUIStore.getState().modals.profile).toBe(false);
		});

		it("should close modal correctly", () => {
			const { openModal, closeModal } = useUIStore.getState();

			openModal("settings");
			closeModal("settings");

			expect(useUIStore.getState().modals.settings).toBe(false);
		});

		it("should handle multiple modals independently", () => {
			const { openModal, closeModal } = useUIStore.getState();

			openModal("settings");
			openModal("profile");
			closeModal("settings");

			expect(useUIStore.getState().modals.settings).toBe(false);
			expect(useUIStore.getState().modals.profile).toBe(true);
		});
	});

	describe("Notification Management", () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it("should add notification with auto-generated ID", () => {
			const { addNotification } = useUIStore.getState();

			addNotification({
				type: "success",
				title: "Test notification",
				message: "This is a test",
			});

			const notifications = useUIStore.getState().notifications;
			expect(notifications).toHaveLength(1);
			expect(notifications[0].title).toBe("Test notification");
			expect(notifications[0].id).toBeDefined();
		});

		it("should remove notification by ID", () => {
			const { addNotification, removeNotification } = useUIStore.getState();

			addNotification({
				type: "info",
				title: "Test notification",
			});

			const notifications = useUIStore.getState().notifications;
			const notificationId = notifications[0].id;

			removeNotification(notificationId);

			expect(useUIStore.getState().notifications).toHaveLength(0);
		});

		it("should auto-remove notification after duration", () => {
			const { addNotification } = useUIStore.getState();

			addNotification({
				type: "warning",
				title: "Auto-remove test",
				duration: 1000,
			});

			expect(useUIStore.getState().notifications).toHaveLength(1);

			// Fast-forward time
			vi.advanceTimersByTime(1000);

			expect(useUIStore.getState().notifications).toHaveLength(0);
		});

		it("should not auto-remove notification with duration 0", () => {
			const { addNotification } = useUIStore.getState();

			addNotification({
				type: "error",
				title: "Persistent notification",
				duration: 0,
			});

			expect(useUIStore.getState().notifications).toHaveLength(1);

			// Fast-forward time
			vi.advanceTimersByTime(10000);

			expect(useUIStore.getState().notifications).toHaveLength(1);
		});
	});

	describe("Loading Management", () => {
		it("should set loading state", () => {
			const { setLoading } = useUIStore.getState();

			setLoading("fetchProjects", true);

			expect(useUIStore.getState().loading.fetchProjects).toBe(true);
		});

		it("should clear loading state", () => {
			const { setLoading } = useUIStore.getState();

			setLoading("fetchProjects", true);
			setLoading("fetchProjects", false);

			expect(useUIStore.getState().loading.fetchProjects).toBeUndefined();
		});

		it("should handle multiple loading states", () => {
			const { setLoading } = useUIStore.getState();

			setLoading("fetchProjects", true);
			setLoading("createProject", true);
			setLoading("fetchProjects", false);

			const loadingState = useUIStore.getState().loading;
			expect(loadingState.fetchProjects).toBeUndefined();
			expect(loadingState.createProject).toBe(true);
		});
	});

	describe("Store Reset", () => {
		it("should reset store to initial state", () => {
			const {
				setTheme,
				toggleSidebar,
				openModal,
				addNotification,
				setLoading,
				reset,
			} = useUIStore.getState();

			// Modify state
			setTheme("dark");
			toggleSidebar();
			openModal("settings");
			addNotification({ type: "info", title: "Test" });
			setLoading("test", true);

			// Reset
			reset();

			const state = useUIStore.getState();
			expect(state.theme).toBe("system");
			expect(state.sidebarOpen).toBe(true);
			expect(state.modals.settings).toBe(false);
			expect(state.notifications).toHaveLength(0);
			expect(Object.keys(state.loading)).toHaveLength(0);
		});
	});
});
