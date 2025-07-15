import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
	parameters: {
		actions: { argTypesRegex: "^on[A-Z].*" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
		docs: {
			autodocs: "tag",
		},
		backgrounds: {
			default: "light",
			values: [
				{
					name: "light",
					value: "#ffffff",
				},
				{
					name: "dark",
					value: "#0a0a0a",
				},
			],
		},
		viewport: {
			viewports: {
				mobile: {
					name: "Mobile",
					styles: {
						width: "375px",
						height: "667px",
					},
				},
				tablet: {
					name: "Tablet",
					styles: {
						width: "768px",
						height: "1024px",
					},
				},
				desktop: {
					name: "Desktop",
					styles: {
						width: "1200px",
						height: "800px",
					},
				},
			},
		},
	},
	globalTypes: {
		darkMode: {
			description: "Global theme for components",
			defaultValue: "light",
			toolbar: {
				title: "Theme",
				icon: "paintbrush",
				items: [
					{ value: "light", title: "Light", icon: "sun" },
					{ value: "dark", title: "Dark", icon: "moon" },
				],
				dynamicTitle: true,
			},
		},
	},
};

export default preview;
