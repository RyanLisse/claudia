// Frontend Accessibility Configuration
// WCAG 2.1 AA compliance settings

export const accessibilityConfig = {
	// WCAG compliance level
	wcagLevel: "AA",
	wcagVersion: "2.1",

	// Automated testing rules
	axeConfig: {
		rules: {
			// Color contrast requirements
			"color-contrast": { enabled: true, level: "AA" },
			"color-contrast-enhanced": { enabled: false, level: "AAA" },

			// Keyboard navigation
			keyboard: { enabled: true },
			"focus-order-semantics": { enabled: true },
			tabindex: { enabled: true },

			// Screen reader support
			"aria-allowed-attr": { enabled: true },
			"aria-hidden-focus": { enabled: true },
			"aria-required-children": { enabled: true },
			"aria-required-parent": { enabled: true },
			"aria-roles": { enabled: true },
			"aria-valid-attr": { enabled: true },
			"aria-valid-attr-value": { enabled: true },

			// Semantic HTML
			"button-name": { enabled: true },
			"form-field-multiple-labels": { enabled: true },
			"heading-order": { enabled: true },
			label: { enabled: true },
			"link-name": { enabled: true },

			// Images and media
			"image-alt": { enabled: true },
			"audio-caption": { enabled: true },
			"video-caption": { enabled: true },

			// Page structure
			"landmark-one-main": { enabled: true },
			"page-has-heading-one": { enabled: true },
			region: { enabled: true },
		},

		// Testing environment settings
		tags: ["wcag2a", "wcag2aa", "best-practice"],

		// Performance settings
		timeout: 10000,

		// Include/exclude patterns
		include: [["html"]],
		exclude: ['[data-testid="loading"]', ".skeleton", '[aria-hidden="true"]'],
	},

	// Component accessibility standards
	componentStandards: {
		// Interactive elements
		button: {
			requiredProps: ["aria-label", "type"],
			focusable: true,
			keyboardNavigable: true,
		},

		input: {
			requiredProps: ["aria-label", "id"],
			labelRequired: true,
			errorMessaging: true,
		},

		dialog: {
			requiredProps: ["aria-labelledby", "role"],
			focusTrap: true,
			escapeKey: true,
		},

		// Navigation
		navigation: {
			landmarkRole: true,
			skipLinks: true,
			breadcrumbs: true,
		},
	},

	// Testing thresholds
	testingThresholds: {
		// Minimum accessibility score
		minScore: 95,

		// Maximum violations by severity
		violations: {
			critical: 0,
			serious: 0,
			moderate: 5,
			minor: 10,
		},

		// Performance impact limits
		maxTestTime: 30000, // 30 seconds
		maxPageLoadTime: 5000, // 5 seconds
	},

	// Browser testing matrix
	browserSupport: {
		// Screen readers
		screenReaders: [
			"NVDA", // Windows
			"JAWS", // Windows
			"VoiceOver", // macOS/iOS
			"TalkBack", // Android
		],

		// Browsers with accessibility features
		browsers: ["Chrome", "Firefox", "Safari", "Edge"],

		// Mobile accessibility
		mobile: {
			iOS: ["15.0", "16.0", "17.0"],
			Android: ["11", "12", "13", "14"],
		},
	},

	// Reporting configuration
	reporting: {
		// Output formats
		formats: ["json", "html", "csv"],

		// Report detail level
		detailLevel: "verbose",

		// Include success criteria
		includeSuccesses: false,

		// Include best practices
		includeBestPractices: true,
	},

	// Development tools
	devTools: {
		// Browser extensions
		extensions: [
			"axe DevTools",
			"WAVE",
			"Lighthouse",
			"Accessibility Insights",
		],

		// IDE integrations
		ide: {
			vscode: ["axe Accessibility Linter"],
			eslint: ["eslint-plugin-jsx-a11y"],
		},
	},
};

export default accessibilityConfig;
