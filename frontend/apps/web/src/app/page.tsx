"use client";

import { motion } from "framer-motion";
import { Bot, FolderCode } from "lucide-react";
import { useState } from "react";

export default function HomePage() {
	const [_showNFO, setShowNFO] = useState(false);

	const _handleNavigation = (path: string) => {
		window.location.href = path;
	};

	return (
		<>
			{/* Simplified Topbar */}
			<div className="border-border border-b bg-background px-4 py-3">
				<div className="flex items-center justify-between">
					<div className="text-muted-foreground text-sm">
						Claudia - Claude Code GUI
					</div>
					<div className="flex items-center space-x-2">
						<button
							onClick={() => setShowNFO(true)}
							className="rounded px-3 py-1 text-sm hover:bg-accent"
						>
							About
						</button>
					</div>
				</div>
			</div>

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
									className="h-64 cursor-pointer rounded-lg border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
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
									className="h-64 cursor-pointer rounded-lg border border-border/50 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-lg"
									onClick={() => (window.location.href = "/projects")}
								>
									<div className="flex h-full flex-col items-center justify-center p-8">
										<FolderCode className="mb-4 h-16 w-16 text-primary" />
										<h2 className="font-semibold text-xl">CC Projects</h2>
									</div>
								</div>
							</motion.div>
						</div>

						{/* Electric SQL Test Component - Temporarily disabled for build */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
							className="mt-8"
						>
							<div className="rounded-lg border p-4">
								<h3 className="mb-2 font-semibold text-lg">
									Electric SQL Test
								</h3>
								<p className="text-muted-foreground">
									Electric SQL integration temporarily disabled for build
									optimization.
								</p>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</>
	);
}
