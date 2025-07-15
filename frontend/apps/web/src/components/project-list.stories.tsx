import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { type Project, ProjectList } from "./project-list";

const mockProjects: Project[] = [
	{
		id: "project-1",
		path: "/Users/developer/projects/ai-assistant",
		sessions: ["session-1", "session-2", "session-3"],
		created_at: Date.now() / 1000 - 86400, // 1 day ago
	},
	{
		id: "project-2",
		path: "/Users/developer/projects/web-scraper",
		sessions: ["session-4", "session-5"],
		created_at: Date.now() / 1000 - 172800, // 2 days ago
	},
	{
		id: "project-3",
		path: "/Users/developer/projects/data-analysis",
		sessions: ["session-6"],
		created_at: Date.now() / 1000 - 259200, // 3 days ago
	},
	{
		id: "project-4",
		path: "/Users/developer/projects/mobile-app",
		sessions: [],
		created_at: Date.now() / 1000 - 345600, // 4 days ago
	},
	{
		id: "project-5",
		path: "/Users/developer/projects/machine-learning",
		sessions: ["session-7", "session-8", "session-9", "session-10"],
		created_at: Date.now() / 1000 - 432000, // 5 days ago
	},
];

const meta: Meta<typeof ProjectList> = {
	title: "Components/ProjectList",
	component: ProjectList,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"A responsive project list component with pagination, hover animations, and project management features. Displays projects in a grid layout with session counts and project metadata.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		projects: {
			description: "Array of projects to display",
			control: "object",
		},
		onProjectClick: {
			description: "Callback when a project is clicked",
			action: "project-clicked",
		},
		onProjectSettings: {
			description: "Callback when project settings is clicked",
			action: "project-settings-clicked",
		},
		loading: {
			description: "Whether the list is loading",
			control: "boolean",
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
		projects: mockProjects.slice(0, 3),
		onProjectClick: action("project-clicked"),
		onProjectSettings: action("project-settings-clicked"),
		loading: false,
	},
};

export const Loading: Story = {
	args: {
		projects: [],
		onProjectClick: action("project-clicked"),
		loading: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Loading state with skeleton placeholders while projects are being fetched.",
			},
		},
	},
};

export const Empty: Story = {
	args: {
		projects: [],
		onProjectClick: action("project-clicked"),
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story: "Empty state when no projects are available.",
			},
		},
	},
};

export const ManyProjects: Story = {
	args: {
		projects: [
			...mockProjects,
			...Array.from({ length: 15 }, (_, i) => ({
				id: `project-${i + 6}`,
				path: `/Users/developer/projects/generated-project-${i + 1}`,
				sessions: Array.from(
					{ length: Math.floor(Math.random() * 5) },
					(_, j) => `session-${i + j + 20}`,
				),
				created_at: Date.now() / 1000 - (i + 6) * 86400,
			})),
		],
		onProjectClick: action("project-clicked"),
		onProjectSettings: action("project-settings-clicked"),
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Example with many projects to demonstrate pagination functionality.",
			},
		},
	},
};

export const WithoutSettings: Story = {
	args: {
		projects: mockProjects.slice(0, 3),
		onProjectClick: action("project-clicked"),
		// onProjectSettings not provided
		loading: false,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Project list without settings functionality - no dropdown menu will appear.",
			},
		},
	},
};

export const Responsive: Story = {
	args: {
		projects: mockProjects,
		onProjectClick: action("project-clicked"),
		onProjectSettings: action("project-settings-clicked"),
		loading: false,
	},
	parameters: {
		viewport: {
			defaultViewport: "mobile",
		},
		docs: {
			description: {
				story:
					"Responsive behavior on mobile devices - grid adapts to single column.",
			},
		},
	},
};
