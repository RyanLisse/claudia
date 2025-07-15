import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { Topbar } from "./topbar";

const meta: Meta<typeof Topbar> = {
	title: "Components/Topbar",
	component: Topbar,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"A responsive topbar component with status indicator and navigation buttons. Displays Claude Code version status and provides quick access to various application features.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		onClaudeClick: {
			description: "Callback when CLAUDE.md button is clicked",
			action: "claude-clicked",
		},
		onSettingsClick: {
			description: "Callback when Settings button is clicked",
			action: "settings-clicked",
		},
		onUsageClick: {
			description: "Callback when Usage Dashboard button is clicked",
			action: "usage-clicked",
		},
		onMCPClick: {
			description: "Callback when MCP button is clicked",
			action: "mcp-clicked",
		},
		onInfoClick: {
			description: "Callback when Info button is clicked",
			action: "info-clicked",
		},
		className: {
			description: "Optional CSS classes for styling",
			control: "text",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		onClaudeClick: action("claude-clicked"),
		onSettingsClick: action("settings-clicked"),
		onUsageClick: action("usage-clicked"),
		onMCPClick: action("mcp-clicked"),
		onInfoClick: action("info-clicked"),
	},
};

export const WithCustomStyles: Story = {
	args: {
		...Default.args,
		className: "bg-blue-50 border-blue-200",
	},
	parameters: {
		docs: {
			description: {
				story: "Topbar with custom styling applied via className prop.",
			},
		},
	},
};

export const AllInteractions: Story = {
	args: {
		...Default.args,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Interactive example showing all button actions. Click each button to see the action logs.",
			},
		},
	},
	play: async ({ canvasElement }) => {
		// Interactive test can be added here for automated testing
	},
};
