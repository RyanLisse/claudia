import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Notification, UIActions, UIState } from "./types";

interface UIStore extends UIState, UIActions {
	reset: () => void;
}

const initialState: UIState = {
	theme: "system",
	sidebarOpen: true,
	modals: {
		settings: false,
		profile: false,
		help: false,
	},
	notifications: [],
	loading: {},
};

export const useUIStore = create<UIStore>()(
	devtools(
		persist(
			(set, get) => ({
				...initialState,

				// Theme actions
				setTheme: (theme) => {
					set((state) => ({
						...state,
						theme,
					}));
				},

				// Sidebar actions
				toggleSidebar: () => {
					set((state) => ({
						...state,
						sidebarOpen: !state.sidebarOpen,
					}));
				},

				// Modal actions
				openModal: (modal) => {
					set((state) => ({
						...state,
						modals: {
							...state.modals,
							[modal]: true,
						},
					}));
				},

				closeModal: (modal) => {
					set((state) => ({
						...state,
						modals: {
							...state.modals,
							[modal]: false,
						},
					}));
				},

				// Notification actions
				addNotification: (notification) => {
					const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
					const newNotification: Notification = {
						id,
						duration: 5000,
						...notification,
					};

					set((state) => ({
						...state,
						notifications: [...state.notifications, newNotification],
					}));

					// Auto-remove notification after duration
					if (newNotification.duration && newNotification.duration > 0) {
						setTimeout(() => {
							get().removeNotification(id);
						}, newNotification.duration);
					}
				},

				removeNotification: (id) => {
					set((state) => ({
						...state,
						notifications: state.notifications.filter((n) => n.id !== id),
					}));
				},

				// Loading actions
				setLoading: (key, loading) => {
					set((state) => ({
						...state,
						loading: loading
							? { ...state.loading, [key]: true }
							: { ...state.loading, [key]: undefined },
					}));
				},

				// Reset to initial state
				reset: () => {
					set(initialState);
				},
			}),
			{
				name: "ui-store",
				partialize: (state) => ({
					theme: state.theme,
					sidebarOpen: state.sidebarOpen,
				}),
			},
		),
		{ name: "UI Store" },
	),
);
