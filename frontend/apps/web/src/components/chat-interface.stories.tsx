import { action } from "@storybook/addon-actions";
import type { Meta, StoryObj } from "@storybook/react";
import { ChatInterface, type ChatMessage } from "./chat-interface";

const mockMessages: ChatMessage[] = [
	{
		id: "1",
		role: "user",
		content: "Hello! Can you help me build a React component?",
		timestamp: new Date(Date.now() - 300000), // 5 minutes ago
	},
	{
		id: "2",
		role: "assistant",
		content:
			"Hello! I'd be happy to help you build a React component. What kind of component are you looking to create? Could you provide some details about its functionality and requirements?",
		timestamp: new Date(Date.now() - 280000), // 4 minutes 40 seconds ago
		metadata: {
			model: "Claude-3.5-Sonnet",
			tokens: 156,
			processing_time: 1200,
		},
	},
	{
		id: "3",
		role: "user",
		content:
			"I need a modal dialog component with animations. It should have a backdrop, close button, and support for custom content.",
		timestamp: new Date(Date.now() - 240000), // 4 minutes ago
		attachments: [
			{
				id: "att-1",
				name: "modal-mockup.png",
				type: "image/png",
				size: 245760,
				url: "https://example.com/modal-mockup.png",
			},
		],
	},
	{
		id: "4",
		role: "assistant",
		content:
			'Great! I can help you create a modal dialog component with animations. Based on your requirements and the mockup you provided, I\'ll build a flexible modal component using Framer Motion for smooth animations.\n\nHere\'s a complete implementation:\n\n```tsx\nimport React from \'react\';\nimport { motion, AnimatePresence } from \'framer-motion\';\nimport { X } from \'lucide-react\';\n\ninterface ModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  title?: string;\n  children: React.ReactNode;\n}\n\nexport const Modal: React.FC<ModalProps> = ({\n  isOpen,\n  onClose,\n  title,\n  children,\n}) => {\n  return (\n    <AnimatePresence>\n      {isOpen && (\n        <motion.div\n          initial={{ opacity: 0 }}\n          animate={{ opacity: 1 }}\n          exit={{ opacity: 0 }}\n          className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50\"\n          onClick={onClose}\n        >\n          <motion.div\n            initial={{ scale: 0.95, opacity: 0 }}\n            animate={{ scale: 1, opacity: 1 }}\n            exit={{ scale: 0.95, opacity: 0 }}\n            transition={{ type: \"spring\", damping: 20 }}\n            className=\"bg-white rounded-lg shadow-xl max-w-md w-full\"\n            onClick={(e) => e.stopPropagation()}\n          >\n            {title && (\n              <div className=\"flex items-center justify-between p-4 border-b\">\n                <h2 className=\"text-lg font-semibold\">{title}</h2>\n                <button\n                  onClick={onClose}\n                  className=\"p-1 hover:bg-gray-100 rounded\"\n                >\n                  <X className=\"h-5 w-5\" />\n                </button>\n              </div>\n            )}\n            <div className=\"p-4\">{children}</div>\n          </motion.div>\n        </motion.div>\n      )}\n    </AnimatePresence>\n  );\n};\n```\n\nThis component includes:\n- Backdrop with opacity animation\n- Modal content with scale and opacity animations\n- Spring animation for smooth feel\n- Click outside to close\n- Optional title and close button\n- Flexible content area',
		timestamp: new Date(Date.now() - 120000), // 2 minutes ago
		metadata: {
			model: "Claude-3.5-Sonnet",
			tokens: 892,
			processing_time: 3400,
		},
	},
];

const meta: Meta<typeof ChatInterface> = {
	title: "Components/ChatInterface",
	component: ChatInterface,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"A comprehensive chat interface component with real-time messaging, file attachments, voice recording, and typing indicators. Supports both user and assistant messages with metadata display.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		messages: {
			description: "Array of chat messages to display",
			control: "object",
		},
		onSendMessage: {
			description: "Callback when a message is sent",
			action: "message-sent",
		},
		isLoading: {
			description: "Whether the chat is processing a message",
			control: "boolean",
		},
		placeholder: {
			description: "Placeholder text for the input field",
			control: "text",
		},
		disabled: {
			description: "Whether the chat input is disabled",
			control: "boolean",
		},
		maxHeight: {
			description: "Maximum height of the chat container",
			control: "text",
		},
		showTypingIndicator: {
			description: "Whether to show typing indicator",
			control: "boolean",
		},
		agentName: {
			description: "Name of the AI agent",
			control: "text",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		messages: mockMessages,
		onSendMessage: action("message-sent"),
		isLoading: false,
		placeholder: "Type your message...",
		disabled: false,
		maxHeight: "500px",
		showTypingIndicator: false,
		agentName: "Claude Assistant",
	},
};

export const Empty: Story = {
	args: {
		messages: [],
		onSendMessage: action("message-sent"),
		isLoading: false,
		placeholder: "Start a conversation...",
		agentName: "Claude Assistant",
	},
	parameters: {
		docs: {
			description: {
				story: "Empty chat interface ready for the first message.",
			},
		},
	},
};

export const Loading: Story = {
	args: {
		messages: mockMessages,
		onSendMessage: action("message-sent"),
		isLoading: true,
		placeholder: "Type your message...",
		agentName: "Claude Assistant",
	},
	parameters: {
		docs: {
			description: {
				story: "Chat interface in loading state while processing a message.",
			},
		},
	},
};

export const WithTypingIndicator: Story = {
	args: {
		messages: mockMessages,
		onSendMessage: action("message-sent"),
		isLoading: false,
		showTypingIndicator: true,
		placeholder: "Type your message...",
		agentName: "Claude Assistant",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Chat interface showing typing indicator when the assistant is composing a response.",
			},
		},
	},
};

export const Disabled: Story = {
	args: {
		messages: mockMessages,
		onSendMessage: action("message-sent"),
		disabled: true,
		placeholder: "Chat is currently disabled...",
		agentName: "Claude Assistant",
	},
	parameters: {
		docs: {
			description: {
				story: "Disabled chat interface - input and actions are not available.",
			},
		},
	},
};

export const CompactHeight: Story = {
	args: {
		messages: mockMessages,
		onSendMessage: action("message-sent"),
		maxHeight: "300px",
		placeholder: "Type your message...",
		agentName: "Claude Assistant",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Chat interface with limited height showing scrollable message area.",
			},
		},
	},
};

export const CustomAgent: Story = {
	args: {
		messages: mockMessages.map((msg) =>
			msg.role === "assistant"
				? { ...msg, metadata: { ...msg.metadata, model: "GPT-4" } }
				: msg,
		),
		onSendMessage: action("message-sent"),
		agentName: "GPT-4 Assistant",
		placeholder: "Ask GPT-4 anything...",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Chat interface configured for a different AI agent with custom branding.",
			},
		},
	},
};
