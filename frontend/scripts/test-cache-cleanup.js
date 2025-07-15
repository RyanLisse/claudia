#!/usr/bin/env node

/**
 * Test Cache Cleanup Script
 * Clears various test caches and temporary files to improve performance
 */

const fs = require("node:fs");
const path = require("node:path");

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
		}
	} catch (_error) {}
}

function removeTemporaryFiles() {
	try {
		const { execSync } = require("node:child_process");
		temporaryFiles.forEach((pattern) => {
			try {
				execSync(`find . -name "${pattern}" -type f -delete`, {
					stdio: "ignore",
				});
			} catch (_error) {
				// Ignore errors for files that don't exist
			}
		});
	} catch (_error) {}
}

function main() {
	// Remove cache directories
	cacheDirectories.forEach(removeDirectory);

	// Remove temporary files
	removeTemporaryFiles();
}

if (require.main === module) {
	main();
}

module.exports = { removeDirectory, removeTemporaryFiles };
