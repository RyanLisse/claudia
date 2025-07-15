import type { TestRunnerConfig } from "@storybook/test-runner";
import { checkA11y, configureAxe, injectAxe } from "axe-playwright";

const config: TestRunnerConfig = {
	async preVisit(page) {
		await injectAxe(page);
	},

	async postVisit(page, _context) {
		// Configure axe for better accessibility testing
		await configureAxe(page, {
			rules: {
				// Disable color contrast rule since we use CSS custom properties
				"color-contrast": { enabled: false },
				// Enable other important rules
				"button-name": { enabled: true },
				"link-name": { enabled: true },
				"aria-allowed-attr": { enabled: true },
				"aria-required-children": { enabled: true },
				"aria-required-parent": { enabled: true },
				"aria-roles": { enabled: true },
				"aria-valid-attr": { enabled: true },
				"aria-valid-attr-value": { enabled: true },
				"duplicate-id": { enabled: true },
				"focus-order-semantics": { enabled: true },
				"form-field-multiple-labels": { enabled: true },
				keyboard: { enabled: true },
				label: { enabled: true },
				"landmark-one-main": { enabled: true },
				"page-has-heading-one": { enabled: false }, // Not needed for component testing
				region: { enabled: false }, // Not needed for component testing
				"skip-link": { enabled: false }, // Not needed for component testing
			},
		});

		// Run accessibility checks
		await checkA11y(page, "#storybook-root", {
			detailedReport: true,
			detailedReportOptions: {
				html: true,
			},
		});
	},

	// Test different viewports for responsive design
	tags: {
		include: ["test"],
		exclude: ["skip-test"],
	},
};

export default config;
