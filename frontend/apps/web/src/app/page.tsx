"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, FolderCode } from "lucide-react";
import { Topbar } from "@/components/topbar";

export default function HomePage() {
	const [showNFO, setShowNFO] = useState(false);

	const handleNavigation = (path: string) => {
		window.location.href = path;
	};

	return (
		<>
			{/* Topbar */}
			<Topbar
				onClaudeClick={() => console.log("Claude clicked")}
				onSettingsClick={() => console.log("Settings clicked")}
				onUsageClick={() => console.log("Usage clicked")}
				onMCPClick={() => console.log("MCP clicked")}
				onInfoClick={() => setShowNFO(true)}
			/>
			
			{/* Main Content */}
			<div className="flex-1 overflow-y-auto">
				<div
					className="flex items-center justify-center p-4"
					style={{ height: "100%" }}
				>
				<div className="w-full max-w-4xl">
					{/* Welcome Header */}
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="mb-12 text-center"
					>
						<h1 className="font-bold text-4xl tracking-tight">
							<span className="rotating-symbol" />
							Welcome to Claudia
						</h1>
					</motion.div>

					{/* Navigation Cards */}
					<div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
						{/* CC Agents Card */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.5, delay: 0.1 }}
						>
							<div
								className="shimmer-hover trailing-border h-64 cursor-pointer rounded-lg border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
								onClick={() => (window.location.href = "/agents")}
							>
								<div className="flex h-full flex-col items-center justify-center p-8">
									<Bot className="mb-4 h-16 w-16 text-primary" />
									<h2 className="font-semibold text-xl">CC Agents</h2>
								</div>
							</div>
						</motion.div>

						{/* CC Projects Card */}
						<motion.div
							initial={{ opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.5, delay: 0.2 }}
						>
							<div
								className="shimmer-hover trailing-border h-64 cursor-pointer rounded-lg border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
								onClick={() => (window.location.href = "/projects")}
							>
								<div className="flex h-full flex-col items-center justify-center p-8">
									<FolderCode className="mb-4 h-16 w-16 text-primary" />
									<h2 className="font-semibold text-xl">CC Projects</h2>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
				</div>
			</div>
		</>
	);
}
