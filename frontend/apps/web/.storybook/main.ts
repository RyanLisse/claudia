import path from "node:path";
import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
	stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@storybook/addon-essentials",
		"@storybook/addon-interactions",
		"@storybook/addon-links",
		"@storybook/addon-docs",
		"@storybook/addon-controls",
		"@storybook/addon-viewport",
		"@storybook/addon-backgrounds",
		"@storybook/addon-a11y",
	],
	framework: {
		name: "@storybook/nextjs",
		options: {},
	},
	features: {
		experimentalRSC: true,
	},
	typescript: {
		check: false,
		reactDocgen: "react-docgen-typescript",
		reactDocgenTypescriptOptions: {
			shouldExtractLiteralValuesFromEnum: true,
			propFilter: (prop) =>
				prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
		},
	},
	webpackFinal: async (config) => {
		if (config.resolve) {
			config.resolve.alias = {
				...config.resolve.alias,
				"@": path.resolve(__dirname, "../src"),
			};
		}
		return config;
	},
	staticDirs: ["../public"],
};

export default config;
