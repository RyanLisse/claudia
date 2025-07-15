"use client";

import { useEffect, useState } from "react";
import { useAuthStore, useSyncStore } from "@/stores";

interface StoreProviderProps {
	children: React.ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) {
		return <>{children}</>;
	}

	return <StoreProviderClient>{children}</StoreProviderClient>;
}

function StoreProviderClient({ children }: StoreProviderProps) {
	const { initializeSync } = useSyncStore();
	const { refreshSession, isAuthenticated } = useAuthStore();

	useEffect(() => {
		// Initialize sync on app start
		initializeSync();
	}, [initializeSync]);

	useEffect(() => {
		// Auto-refresh session if authenticated
		if (isAuthenticated) {
			const interval = setInterval(
				() => {
					refreshSession();
				},
				15 * 60 * 1000,
			); // Refresh every 15 minutes

			return () => clearInterval(interval);
		}
	}, [isAuthenticated, refreshSession]);

	return <>{children}</>;
}
