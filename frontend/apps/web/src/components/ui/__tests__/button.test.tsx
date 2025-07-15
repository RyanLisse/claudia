import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { Button, buttonVariants } from "../button";

describe("Button", () => {
	it("should render button with default props", () => {
		render(<Button>Test Button</Button>);

		const button = screen.getByRole("button", { name: "Test Button" });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass("inline-flex", "items-center", "justify-center");
	});

	it("should handle click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click Me</Button>);

		const button = screen.getByRole("button", { name: "Click Me" });
		fireEvent.click(button);

		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("should apply custom className", () => {
		render(<Button className="custom-class">Custom Button</Button>);

		const button = screen.getByRole("button", { name: "Custom Button" });
		expect(button).toHaveClass("custom-class");
	});

	it("should render with default variant and size", () => {
		render(<Button>Default Button</Button>);

		const button = screen.getByRole("button", { name: "Default Button" });
		expect(button).toHaveClass(
			"bg-primary",
			"text-primary-foreground",
			"h-10",
			"px-4",
			"py-2",
		);
	});

	describe("variants", () => {
		it("should apply destructive variant", () => {
			render(<Button variant="destructive">Destructive</Button>);

			const button = screen.getByRole("button", { name: "Destructive" });
			expect(button).toHaveClass(
				"bg-destructive",
				"text-destructive-foreground",
			);
		});

		it("should apply outline variant", () => {
			render(<Button variant="outline">Outline</Button>);

			const button = screen.getByRole("button", { name: "Outline" });
			expect(button).toHaveClass("border", "border-input", "bg-background");
		});

		it("should apply secondary variant", () => {
			render(<Button variant="secondary">Secondary</Button>);

			const button = screen.getByRole("button", { name: "Secondary" });
			expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
		});

		it("should apply ghost variant", () => {
			render(<Button variant="ghost">Ghost</Button>);

			const button = screen.getByRole("button", { name: "Ghost" });
			expect(button).toHaveClass(
				"hover:bg-accent",
				"hover:text-accent-foreground",
			);
		});

		it("should apply link variant", () => {
			render(<Button variant="link">Link</Button>);

			const button = screen.getByRole("button", { name: "Link" });
			expect(button).toHaveClass(
				"text-primary",
				"underline-offset-4",
				"hover:underline",
			);
		});
	});

	describe("sizes", () => {
		it("should apply small size", () => {
			render(<Button size="sm">Small</Button>);

			const button = screen.getByRole("button", { name: "Small" });
			expect(button).toHaveClass("h-9", "rounded-md", "px-3");
		});

		it("should apply large size", () => {
			render(<Button size="lg">Large</Button>);

			const button = screen.getByRole("button", { name: "Large" });
			expect(button).toHaveClass("h-11", "rounded-md", "px-8");
		});

		it("should apply icon size", () => {
			render(<Button size="icon">🔥</Button>);

			const button = screen.getByRole("button", { name: "🔥" });
			expect(button).toHaveClass("h-10", "w-10");
		});
	});

	describe("asChild prop", () => {
		it("should render as child component when asChild is true", () => {
			render(
				<Button asChild>
					<a href="/test">Link Button</a>
				</Button>,
			);

			const link = screen.getByRole("link", { name: "Link Button" });
			expect(link).toBeInTheDocument();
			expect(link).toHaveAttribute("href", "/test");
			expect(link).toHaveClass("inline-flex", "items-center", "justify-center");
		});

		it("should render as button when asChild is false", () => {
			render(<Button asChild={false}>Normal Button</Button>);

			const button = screen.getByRole("button", { name: "Normal Button" });
			expect(button).toBeInTheDocument();
		});

		it("should render as button by default", () => {
			render(<Button>Default Button</Button>);

			const button = screen.getByRole("button", { name: "Default Button" });
			expect(button).toBeInTheDocument();
		});
	});

	describe("disabled state", () => {
		it("should apply disabled styles when disabled", () => {
			render(<Button disabled>Disabled Button</Button>);

			const button = screen.getByRole("button", { name: "Disabled Button" });
			expect(button).toBeDisabled();
			expect(button).toHaveClass(
				"disabled:pointer-events-none",
				"disabled:opacity-50",
			);
		});

		it("should not trigger click events when disabled", () => {
			const handleClick = vi.fn();
			render(
				<Button
					disabled
					onClick={handleClick}
					data-testid="disabled-click-test"
				>
					Disabled Button Click Test
				</Button>,
			);

			const button = screen.getByTestId("disabled-click-test");
			fireEvent.click(button);

			expect(handleClick).not.toHaveBeenCalled();
		});
	});

	describe("accessibility", () => {
		it("should have proper aria attributes", () => {
			render(<Button aria-label="Custom aria label">Button</Button>);

			const button = screen.getByRole("button", { name: "Custom aria label" });
			expect(button).toHaveAttribute("aria-label", "Custom aria label");
		});

		it("should support aria-busy attribute", () => {
			render(<Button aria-busy="true">Loading Button</Button>);

			const button = screen.getByRole("button", { name: "Loading Button" });
			expect(button).toHaveAttribute("aria-busy", "true");
		});

		it("should have focus-visible styles", () => {
			render(<Button>Focusable Button</Button>);

			const button = screen.getByRole("button", { name: "Focusable Button" });
			expect(button).toHaveClass(
				"focus-visible:outline-none",
				"focus-visible:ring-2",
			);
		});
	});

	describe("forwarded ref", () => {
		it("should forward ref to button element", () => {
			const ref = React.createRef<HTMLButtonElement>();
			render(<Button ref={ref}>Ref Button</Button>);

			expect(ref.current).toBeInstanceOf(HTMLButtonElement);
			expect(ref.current?.textContent).toBe("Ref Button");
		});

		it("should forward ref to child element when asChild is true", () => {
			const ref = React.createRef<HTMLAnchorElement>();
			render(
				<Button asChild ref={ref}>
					<a href="/test">Link Button</a>
				</Button>,
			);

			expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
			expect(ref.current?.textContent).toBe("Link Button");
		});
	});

	describe("additional HTML attributes", () => {
		it("should pass through button HTML attributes", () => {
			render(
				<Button
					type="submit"
					name="submit-button"
					value="submit-value"
					data-testid="test-button"
				>
					Submit
				</Button>,
			);

			const button = screen.getByTestId("test-button");
			expect(button).toHaveAttribute("type", "submit");
			expect(button).toHaveAttribute("name", "submit-button");
			expect(button).toHaveAttribute("value", "submit-value");
		});

		it("should handle custom event handlers", () => {
			const handleMouseEnter = vi.fn();
			const handleMouseLeave = vi.fn();

			render(
				<Button onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
					Hover Button
				</Button>,
			);

			const button = screen.getByRole("button", { name: "Hover Button" });

			fireEvent.mouseEnter(button);
			expect(handleMouseEnter).toHaveBeenCalledTimes(1);

			fireEvent.mouseLeave(button);
			expect(handleMouseLeave).toHaveBeenCalledTimes(1);
		});
	});

	describe("display name", () => {
		it("should have correct display name", () => {
			expect(Button.displayName).toBe("Button");
		});
	});
});

describe("buttonVariants", () => {
	it("should generate correct classes for default variant and size", () => {
		const classes = buttonVariants();
		expect(classes).toContain("bg-primary");
		expect(classes).toContain("text-primary-foreground");
		expect(classes).toContain("h-10");
		expect(classes).toContain("px-4");
		expect(classes).toContain("py-2");
	});

	it("should generate correct classes for destructive variant", () => {
		const classes = buttonVariants({ variant: "destructive" });
		expect(classes).toContain("bg-destructive");
		expect(classes).toContain("text-destructive-foreground");
	});

	it("should generate correct classes for outline variant", () => {
		const classes = buttonVariants({ variant: "outline" });
		expect(classes).toContain("border");
		expect(classes).toContain("border-input");
		expect(classes).toContain("bg-background");
	});

	it("should generate correct classes for secondary variant", () => {
		const classes = buttonVariants({ variant: "secondary" });
		expect(classes).toContain("bg-secondary");
		expect(classes).toContain("text-secondary-foreground");
	});

	it("should generate correct classes for ghost variant", () => {
		const classes = buttonVariants({ variant: "ghost" });
		expect(classes).toContain("hover:bg-accent");
		expect(classes).toContain("hover:text-accent-foreground");
	});

	it("should generate correct classes for link variant", () => {
		const classes = buttonVariants({ variant: "link" });
		expect(classes).toContain("text-primary");
		expect(classes).toContain("underline-offset-4");
		expect(classes).toContain("hover:underline");
	});

	it("should generate correct classes for small size", () => {
		const classes = buttonVariants({ size: "sm" });
		expect(classes).toContain("h-9");
		expect(classes).toContain("rounded-md");
		expect(classes).toContain("px-3");
	});

	it("should generate correct classes for large size", () => {
		const classes = buttonVariants({ size: "lg" });
		expect(classes).toContain("h-11");
		expect(classes).toContain("rounded-md");
		expect(classes).toContain("px-8");
	});

	it("should generate correct classes for icon size", () => {
		const classes = buttonVariants({ size: "icon" });
		expect(classes).toContain("h-10");
		expect(classes).toContain("w-10");
	});

	it("should handle custom className", () => {
		const classes = buttonVariants({ className: "custom-button-class" });
		expect(classes).toContain("custom-button-class");
	});

	it("should combine variant, size, and className", () => {
		const classes = buttonVariants({
			variant: "destructive",
			size: "lg",
			className: "custom-class",
		});
		expect(classes).toContain("bg-destructive");
		expect(classes).toContain("text-destructive-foreground");
		expect(classes).toContain("h-11");
		expect(classes).toContain("px-8");
		expect(classes).toContain("custom-class");
	});

	it("should always include base classes", () => {
		const classes = buttonVariants({ variant: "ghost", size: "sm" });
		expect(classes).toContain("inline-flex");
		expect(classes).toContain("items-center");
		expect(classes).toContain("justify-center");
		expect(classes).toContain("whitespace-nowrap");
		expect(classes).toContain("rounded-md");
		expect(classes).toContain("font-medium");
		expect(classes).toContain("text-sm");
		expect(classes).toContain("ring-offset-background");
		expect(classes).toContain("transition-colors");
		expect(classes).toContain("focus-visible:outline-none");
		expect(classes).toContain("focus-visible:ring-2");
		expect(classes).toContain("focus-visible:ring-ring");
		expect(classes).toContain("focus-visible:ring-offset-2");
		expect(classes).toContain("disabled:pointer-events-none");
		expect(classes).toContain("disabled:opacity-50");
	});
});
