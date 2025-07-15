import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
	Popover,
	PopoverContent,
	PopoverRoot,
	PopoverTrigger,
} from "../popover";

// Mock @radix-ui/react-popover
vi.mock("@radix-ui/react-popover", () => ({
	Root: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="popover-root">{children}</div>
	),
	Trigger: React.forwardRef<HTMLButtonElement, any>(
		({ asChild, children, ...props }, ref) => {
			if (asChild) {
				return React.cloneElement(children, {
					ref,
					...props,
					"data-testid": "popover-trigger",
				});
			}
			return (
				<button ref={ref} {...props} data-testid="popover-trigger">
					{children}
				</button>
			);
		},
	),
	Portal: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="popover-portal">{children}</div>
	),
	Content: React.forwardRef<HTMLDivElement, any>(
		({ children, className, align, sideOffset, ...props }, ref) => (
			<div
				ref={ref}
				className={className}
				data-testid="popover-content"
				data-align={align}
				data-side-offset={sideOffset}
				{...props}
			>
				{children}
			</div>
		),
	),
}));

describe("PopoverRoot", () => {
	it("should render children", () => {
		render(
			<PopoverRoot>
				<div>Test content</div>
			</PopoverRoot>,
		);

		expect(screen.getByTestId("popover-root")).toBeInTheDocument();
		expect(screen.getByText("Test content")).toBeInTheDocument();
	});
});

describe("PopoverTrigger", () => {
	it("should render as button by default", () => {
		render(<PopoverTrigger>Trigger Button</PopoverTrigger>);

		const trigger = screen.getByTestId("popover-trigger");
		expect(trigger).toBeInTheDocument();
		expect(trigger.tagName).toBe("BUTTON");
		expect(trigger).toHaveTextContent("Trigger Button");
	});

	it("should render as child element when asChild is true", () => {
		render(
			<PopoverTrigger asChild>
				<div>Custom Trigger</div>
			</PopoverTrigger>,
		);

		const trigger = screen.getByTestId("popover-trigger");
		expect(trigger).toBeInTheDocument();
		expect(trigger.tagName).toBe("DIV");
		expect(trigger).toHaveTextContent("Custom Trigger");
	});

	it("should forward props to the trigger element", () => {
		render(
			<PopoverTrigger disabled aria-label="Open popover">
				Trigger
			</PopoverTrigger>,
		);

		const trigger = screen.getByTestId("popover-trigger");
		expect(trigger).toHaveAttribute("disabled");
		expect(trigger).toHaveAttribute("aria-label", "Open popover");
	});

	it("should forward ref correctly", () => {
		const ref = React.createRef<HTMLButtonElement>();
		render(<PopoverTrigger ref={ref}>Trigger</PopoverTrigger>);

		expect(ref.current).toBeInstanceOf(HTMLButtonElement);
	});
});

describe("PopoverContent", () => {
	it("should render content within portal", () => {
		render(
			<PopoverContent>
				<p>Popover content</p>
			</PopoverContent>,
		);

		expect(screen.getByTestId("popover-portal")).toBeInTheDocument();
		expect(screen.getByTestId("popover-content")).toBeInTheDocument();
		expect(screen.getByText("Popover content")).toBeInTheDocument();
	});

	it("should apply default props", () => {
		render(<PopoverContent>Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-align", "center");
		expect(content).toHaveAttribute("data-side-offset", "4");
	});

	it("should accept custom align prop", () => {
		render(<PopoverContent align="start">Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-align", "start");
	});

	it("should accept custom sideOffset prop", () => {
		render(<PopoverContent sideOffset={8}>Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-side-offset", "8");
	});

	it("should apply custom className", () => {
		render(<PopoverContent className="custom-class">Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveClass("custom-class");
	});

	it("should apply default styling classes", () => {
		render(<PopoverContent>Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content.className).toContain("z-50");
		expect(content.className).toContain("w-72");
		expect(content.className).toContain("rounded-md");
		expect(content.className).toContain("border");
		expect(content.className).toContain("bg-popover");
		expect(content.className).toContain("p-4");
		expect(content.className).toContain("text-popover-foreground");
		expect(content.className).toContain("shadow-md");
		expect(content.className).toContain("outline-none");
	});

	it("should apply animation classes", () => {
		render(<PopoverContent>Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content.className).toContain("data-[state=closed]:fade-out-0");
		expect(content.className).toContain("data-[state=open]:fade-in-0");
		expect(content.className).toContain("data-[state=closed]:zoom-out-95");
		expect(content.className).toContain("data-[state=open]:zoom-in-95");
		expect(content.className).toContain("data-[state=closed]:animate-out");
		expect(content.className).toContain("data-[state=open]:animate-in");
	});

	it("should apply slide animation classes for different sides", () => {
		render(<PopoverContent>Content</PopoverContent>);

		const content = screen.getByTestId("popover-content");
		expect(content.className).toContain(
			"data-[side=bottom]:slide-in-from-top-2",
		);
		expect(content.className).toContain(
			"data-[side=left]:slide-in-from-right-2",
		);
		expect(content.className).toContain(
			"data-[side=right]:slide-in-from-left-2",
		);
		expect(content.className).toContain(
			"data-[side=top]:slide-in-from-bottom-2",
		);
	});

	it("should forward additional props", () => {
		render(
			<PopoverContent data-custom="test" role="dialog">
				Content
			</PopoverContent>,
		);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-custom", "test");
		expect(content).toHaveAttribute("role", "dialog");
	});

	it("should forward ref correctly", () => {
		const ref = React.createRef<HTMLDivElement>();
		render(<PopoverContent ref={ref}>Content</PopoverContent>);

		expect(ref.current).toBeInstanceOf(HTMLDivElement);
	});

	it("should have correct display name", () => {
		// Mock the displayName from the mocked Radix component
		const mockDisplayName = "PopoverContent";
		expect(PopoverContent.displayName).toBe(mockDisplayName);
	});
});

describe("Popover (Simple Component)", () => {
	it("should render trigger and content", () => {
		render(
			<Popover
				trigger={<button>Open Popover</button>}
				content={<div>Popover Content</div>}
			/>,
		);

		expect(screen.getByTestId("popover-root")).toBeInTheDocument();
		expect(screen.getByTestId("popover-trigger")).toBeInTheDocument();
		expect(screen.getByTestId("popover-content")).toBeInTheDocument();
		expect(screen.getByText("Open Popover")).toBeInTheDocument();
		expect(screen.getByText("Popover Content")).toBeInTheDocument();
	});

	it("should use default align center", () => {
		render(
			<Popover
				trigger={<button>Trigger</button>}
				content={<div>Content</div>}
			/>,
		);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-align", "center");
	});

	it("should accept custom align prop", () => {
		render(
			<Popover
				trigger={<button>Trigger</button>}
				content={<div>Content</div>}
				align="start"
			/>,
		);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-align", "start");
	});

	it("should accept align end", () => {
		render(
			<Popover
				trigger={<button>Trigger</button>}
				content={<div>Content</div>}
				align="end"
			/>,
		);

		const content = screen.getByTestId("popover-content");
		expect(content).toHaveAttribute("data-align", "end");
	});

	it("should render complex trigger elements", () => {
		render(
			<Popover
				trigger={
					<div>
						<span>Complex</span> <strong>Trigger</strong>
					</div>
				}
				content={<div>Content</div>}
			/>,
		);

		expect(screen.getByText("Complex")).toBeInTheDocument();
		expect(screen.getByText("Trigger")).toBeInTheDocument();
	});

	it("should render complex content elements", () => {
		render(
			<Popover
				trigger={<button>Trigger</button>}
				content={
					<div>
						<h3>Title</h3>
						<p>Description</p>
						<button>Action</button>
					</div>
				}
			/>,
		);

		expect(screen.getByText("Title")).toBeInTheDocument();
		expect(screen.getByText("Description")).toBeInTheDocument();
		expect(screen.getByText("Action")).toBeInTheDocument();
	});

	it("should handle string content", () => {
		render(
			<Popover
				trigger={<button>Trigger</button>}
				content="Simple string content"
			/>,
		);

		expect(screen.getByText("Simple string content")).toBeInTheDocument();
	});

	it("should handle React fragment as content", () => {
		render(
			<Popover
				trigger={<button>Trigger</button>}
				content={
					<>
						<span>First</span>
						<span>Second</span>
					</>
				}
			/>,
		);

		expect(screen.getByText("First")).toBeInTheDocument();
		expect(screen.getByText("Second")).toBeInTheDocument();
	});

	it("should pass asChild prop to trigger", () => {
		render(
			<Popover
				trigger={<div>Custom Trigger Element</div>}
				content={<div>Content</div>}
			/>,
		);

		const trigger = screen.getByTestId("popover-trigger");
		expect(trigger.tagName).toBe("DIV");
		expect(trigger).toHaveTextContent("Custom Trigger Element");
	});

	describe("accessibility", () => {
		it("should support ARIA attributes on trigger", () => {
			render(
				<Popover
					trigger={
						<button aria-label="Open menu" aria-expanded="false">
							Menu
						</button>
					}
					content={<div>Menu content</div>}
				/>,
			);

			const trigger = screen.getByTestId("popover-trigger");
			expect(trigger).toHaveAttribute("aria-label", "Open menu");
			expect(trigger).toHaveAttribute("aria-expanded", "false");
		});

		it("should support role attribute on content", () => {
			render(
				<Popover
					trigger={<button>Trigger</button>}
					content={
						<div role="menu">
							<div role="menuitem">Item 1</div>
							<div role="menuitem">Item 2</div>
						</div>
					}
				/>,
			);

			expect(screen.getByRole("menu")).toBeInTheDocument();
			expect(screen.getAllByRole("menuitem")).toHaveLength(2);
		});
	});

	describe("integration with other components", () => {
		it("should work with form elements in content", () => {
			render(
				<Popover
					trigger={<button>Open Form</button>}
					content={
						<form>
							<label htmlFor="test-input">Name:</label>
							<input id="test-input" type="text" />
							<button type="submit">Submit</button>
						</form>
					}
				/>,
			);

			expect(screen.getByLabelText("Name:")).toBeInTheDocument();
			expect(screen.getByDisplayValue("")).toBeInTheDocument(); // input field
			expect(screen.getByText("Submit")).toBeInTheDocument();
		});

		it("should work with nested interactive elements", () => {
			const handleClick = vi.fn();

			render(
				<Popover
					trigger={<button>Trigger</button>}
					content={
						<div>
							<button onClick={handleClick}>Nested Button</button>
							<a href="/test">Nested Link</a>
						</div>
					}
				/>,
			);

			const nestedButton = screen.getByText("Nested Button");
			const nestedLink = screen.getByText("Nested Link");

			expect(nestedButton).toBeInTheDocument();
			expect(nestedLink).toBeInTheDocument();
			expect(nestedLink).toHaveAttribute("href", "/test");

			fireEvent.click(nestedButton);
			expect(handleClick).toHaveBeenCalledTimes(1);
		});
	});
});
