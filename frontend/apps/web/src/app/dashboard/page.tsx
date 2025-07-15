import type { Metadata } from "next";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
	title: "Experiment 02 - Crafted.is",
};

export default function Page() {
	return <DashboardContent />;
}
