#!/usr/bin/env node

/**
 * Test Cache Cleanup Script
 * Clears various test caches and temporary files to improve performance
 */

const fs = require("fs");
const path = require("path");

const cacheDirectories = [
	".vitest/cache",
	"apps/web/.vitest/cache",
	"apps/server/.vitest/cache",
	"packages/ui-kit/.vitest/cache",
	"coverage",
	"apps/web/coverage",
	"apps/server/coverage",
	"packages/ui-kit/coverage",
	".turbo",
	"node_modules/.cache",
	"node_modules/.vitest",
];

const temporaryFiles = [
	"vitest.config.ts.timestamp-*",
	"apps/web/vitest.config.ts.timestamp-*",
	"apps/server/vitest.config.ts.timestamp-*",
	"packages/ui-kit/vitest.config.ts.timestamp-*",
];

function removeDirectory(dir) {
	const fullPath = path.join(process.cwd(), dir);
	try {
		if (fs.existsSync(fullPath)) {
			fs.rmSync(fullPath, { recursive: true, force: true });
			console.log(`✅ Removed: ${dir}`);
		}
	} catch (error) {
		console.warn(`⚠️  Failed to remove ${dir}: ${error.message}`);
	}
}

function removeTemporaryFiles() {
	try {
		const { execSync } = require("child_process");
		temporaryFiles.forEach((pattern) => {
			try {
				execSync(`find . -name "${pattern}" -type f -delete`, {
					stdio: "ignore",
				});
			} catch (error) {
				// Ignore errors for files that don't exist
			}
		});
		console.log("✅ Removed temporary files");
	} catch (error) {
		console.warn("⚠️  Failed to remove temporary files:", error.message);
	}
}

function main() {
	console.log("🧹 Starting test cache cleanup...\n");

	// Remove cache directories
	cacheDirectories.forEach(removeDirectory);

	// Remove temporary files
	removeTemporaryFiles();

	console.log("\n✨ Test cache cleanup completed!");
	console.log(
		"💡 Run this script before important test runs for optimal performance.",
	);
}

if (require.main === module) {
	main();
}

module.exports = { removeDirectory, removeTemporaryFiles };
