import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { Heart, X, Plus, ArrowRight } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../src/components/Button";

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

describe("Button", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("renders correctly", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: /click me/i }),
		).toBeInTheDocument();
	});

	it("handles click events", () => {
		const handleClick = vi.fn();
		const { container } = render(
			<Button onClick={handleClick}>Click me unique</Button>,
		);

		const button = container.querySelector("button");
		fireEvent.click(button!);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("shows loading state", () => {
		render(<Button loading>Loading</Button>);

		const button = screen.getByRole("button", { name: /loading/i });
		expect(button).toHaveAttribute("aria-busy");
		expect(button.getAttribute("aria-busy")).toBe("true");
		expect(button).toBeDisabled();
		expect(button).toHaveTextContent("Loading");
	});

	it("is disabled when disabled prop is true", () => {
		render(<Button disabled>Disabled</Button>);

		expect(screen.getByRole("button", { name: /disabled/i })).toBeDisabled();
	});

	it("renders with left icon", () => {
		render(
			<Button leftIcon={<Heart data-testid="heart-icon" />}>With Icon</Button>,
		);

		expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /with icon/i }),
		).toHaveTextContent("With Icon");
	});

	it("renders with right icon", () => {
		render(
			<Button rightIcon={<Heart data-testid="heart-icon" />}>With Icon</Button>,
		);

		expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /with icon/i }),
		).toHaveTextContent("With Icon");
	});

	it("applies correct variant classes", () => {
		const { rerender } = render(<Button variant="destructive">Test Variant</Button>);
		expect(screen.getByRole("button", { name: /test variant/i })).toHaveClass(
			"bg-destructive",
		);

		rerender(<Button variant="outline">Test Variant</Button>);
		expect(screen.getByRole("button", { name: /test variant/i })).toHaveClass(
			"border-input",
		);

		rerender(<Button variant="ghost">Test Variant</Button>);
		expect(screen.getByRole("button", { name: /test variant/i })).toHaveClass(
			"hover:bg-accent",
		);
	});

	it("applies correct size classes", () => {
		const { rerender } = render(<Button size="sm">Test Size</Button>);
		expect(screen.getByRole("button", { name: /test size/i })).toHaveClass("h-9");

		rerender(<Button size="lg">Test Size</Button>);
		expect(screen.getByRole("button", { name: /test size/i })).toHaveClass("h-11");

		rerender(<Button size="icon">Test Size</Button>);
		expect(screen.getByRole("button", { name: /test size/i })).toHaveClass(
			"h-10",
			"w-10",
		);
	});

	it("supports custom className", () => {
		render(<Button className="custom-class">Test Custom</Button>);
		expect(screen.getByRole("button", { name: /test custom/i })).toHaveClass(
			"custom-class",
		);
	});

	it("forwards ref correctly", () => {
		const ref = vi.fn();
		render(<Button ref={ref}>Test Ref</Button>);
		expect(ref).toHaveBeenCalled();
	});

	it("has proper accessibility attributes", () => {
		render(<Button aria-label="Custom label">Test Accessibility</Button>);
		expect(
			screen.getByRole("button", { name: /custom label/i }),
		).toHaveAttribute("aria-label", "Custom label");
	});

	it("prevents click when loading", () => {
		const handleClick = vi.fn();
		render(
			<Button loading onClick={handleClick}>
				Loading
			</Button>,
		);

		fireEvent.click(screen.getByRole("button", { name: /loading/i }));
		expect(handleClick).not.toHaveBeenCalled();
	});

	describe("Variants", () => {
		it("renders default variant correctly", () => {
			render(<Button variant="default">Default</Button>);
			const button = screen.getByRole("button", { name: /default/i });
			expect(button).toHaveClass("bg-primary", "text-primary-foreground");
		});

		it("renders destructive variant correctly", () => {
			render(<Button variant="destructive">Destructive</Button>);
			const button = screen.getByRole("button", { name: /destructive/i });
			expect(button).toHaveClass("bg-destructive", "text-destructive-foreground");
		});

		it("renders outline variant correctly", () => {
			render(<Button variant="outline">Outline</Button>);
			const button = screen.getByRole("button", { name: /outline/i });
			expect(button).toHaveClass("border", "border-input", "bg-background");
		});

		it("renders secondary variant correctly", () => {
			render(<Button variant="secondary">Secondary</Button>);
			const button = screen.getByRole("button", { name: /secondary/i });
			expect(button).toHaveClass("bg-secondary", "text-secondary-foreground");
		});

		it("renders ghost variant correctly", () => {
			render(<Button variant="ghost">Ghost</Button>);
			const button = screen.getByRole("button", { name: /ghost/i });
			expect(button).toHaveClass("hover:bg-accent");
		});

		it("renders link variant correctly", () => {
			render(<Button variant="link">Link</Button>);
			const button = screen.getByRole("button", { name: /link/i });
			expect(button).toHaveClass("text-primary", "underline-offset-4");
		});
	});

	describe("Sizes", () => {
		it("renders default size correctly", () => {
			render(<Button size="default">Default Size</Button>);
			const button = screen.getByRole("button", { name: /default size/i });
			expect(button).toHaveClass("h-10", "px-4", "py-2");
		});

		it("renders small size correctly", () => {
			render(<Button size="sm">Small</Button>);
			const button = screen.getByRole("button", { name: /small/i });
			expect(button).toHaveClass("h-9", "px-3");
		});

		it("renders large size correctly", () => {
			render(<Button size="lg">Large</Button>);
			const button = screen.getByRole("button", { name: /large/i });
			expect(button).toHaveClass("h-11", "px-8");
		});

		it("renders icon size correctly", () => {
			render(<Button size="icon" aria-label="Icon button"><Heart /></Button>);
			const button = screen.getByRole("button", { name: /icon button/i });
			expect(button).toHaveClass("h-10", "w-10");
		});
	});

	describe("Loading State", () => {
		it("displays loading spinner when loading", () => {
			render(<Button loading>Loading Button</Button>);
			const button = screen.getByRole("button", { name: /loading button/i });
			const spinner = button.querySelector('svg[class*="animate-spin"]');
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveAttribute("aria-hidden", "true");
		});

		it("hides left icon when loading", () => {
			render(
				<Button loading leftIcon={<Heart data-testid="heart-icon" />}>
					Loading
				</Button>
			);
			expect(screen.queryByTestId("heart-icon")).not.toBeInTheDocument();
		});

		it("hides right icon when loading", () => {
			render(
				<Button loading rightIcon={<Heart data-testid="heart-icon" />}>
					Loading
				</Button>
			);
			expect(screen.queryByTestId("heart-icon")).not.toBeInTheDocument();
		});

		it("maintains aria-busy state during loading", () => {
			render(<Button loading>Loading</Button>);
			const button = screen.getByRole("button", { name: /loading/i });
			expect(button).toHaveAttribute("aria-busy", "true");
		});

		it("removes aria-busy when not loading", () => {
			render(<Button loading={false}>Not Loading</Button>);
			const button = screen.getByRole("button", { name: /not loading/i });
			expect(button).toHaveAttribute("aria-busy", "false");
		});
	});

	describe("Disabled State", () => {
		it("prevents interaction when disabled", async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();
			render(
				<Button disabled onClick={handleClick}>
					Disabled
				</Button>
			);

			const button = screen.getByRole("button", { name: /disabled/i });
			expect(button).toBeDisabled();
			expect(button).toHaveClass("disabled:pointer-events-none", "disabled:opacity-50");

			await user.click(button);
			expect(handleClick).not.toHaveBeenCalled();
		});

		it("is disabled when loading", () => {
			render(<Button loading>Loading</Button>);
			const button = screen.getByRole("button", { name: /loading/i });
			expect(button).toBeDisabled();
		});

		it("can be disabled and loading simultaneously", () => {
			render(<Button disabled loading>Both</Button>);
			const button = screen.getByRole("button", { name: /both/i });
			expect(button).toBeDisabled();
			expect(button).toHaveAttribute("aria-busy", "true");
		});
	});

	describe("Icon Integration", () => {
		it("renders left icon with proper spacing", () => {
			render(
				<Button leftIcon={<Heart data-testid="heart-icon" />}>
					With Left Icon
				</Button>
			);
			const icon = screen.getByTestId("heart-icon");
			const iconContainer = icon.closest("span");
			expect(iconContainer).toHaveClass("mr-2");
			expect(iconContainer).toHaveAttribute("aria-hidden", "true");
		});

		it("renders right icon with proper spacing", () => {
			render(
				<Button rightIcon={<ArrowRight data-testid="arrow-icon" />}>
					With Right Icon
				</Button>
			);
			const icon = screen.getByTestId("arrow-icon");
			const iconContainer = icon.closest("span");
			expect(iconContainer).toHaveClass("ml-2");
			expect(iconContainer).toHaveAttribute("aria-hidden", "true");
		});

		it("renders both left and right icons", () => {
			render(
				<Button 
					leftIcon={<Heart data-testid="heart-icon" />}
					rightIcon={<ArrowRight data-testid="arrow-icon" />}
				>
					Both Icons
				</Button>
			);
			expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
			expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();
		});

		it("icon-only button with proper size", () => {
			render(
				<Button size="icon" aria-label="Close">
					<X data-testid="close-icon" />
				</Button>
			);
			const button = screen.getByRole("button", { name: /close/i });
			expect(button).toHaveClass("h-10", "w-10");
			expect(screen.getByTestId("close-icon")).toBeInTheDocument();
		});
	});

	describe("AsChild Prop", () => {
		it("renders as child element when asChild is true", () => {
			const { container } = render(
				<Button asChild>
					<a href="#" data-testid="link-button">
						Link Button
					</a>
				</Button>
			);

			const linkElement = screen.getByTestId("link-button");
			expect(linkElement).toBeInTheDocument();
			expect(linkElement.tagName).toBe("A");
			expect(linkElement).toHaveClass("inline-flex", "items-center");
			expect(container.querySelector("button")).not.toBeInTheDocument();
		});

		it("maintains styling when used as child", () => {
			render(
				<Button asChild variant="destructive" size="lg">
					<a href="#" data-testid="styled-link">
						Styled Link
					</a>
				</Button>
			);

			const linkElement = screen.getByTestId("styled-link");
			expect(linkElement).toHaveClass("bg-destructive", "h-11", "px-8");
		});
	});

	describe("Custom Styling", () => {
		it("merges custom className with default styles", () => {
			render(<Button className="custom-style extra-padding">Custom</Button>);
			const button = screen.getByRole("button", { name: /custom/i });
			expect(button).toHaveClass("custom-style", "extra-padding");
			expect(button).toHaveClass("inline-flex", "items-center"); // Base classes
		});

		it("applies data attributes correctly", () => {
			render(
				<Button data-testid="custom-data" data-custom="value">
					Data Attributes
				</Button>
			);
			const button = screen.getByRole("button", { name: /data attributes/i });
			expect(button).toHaveAttribute("data-testid", "custom-data");
			expect(button).toHaveAttribute("data-custom", "value");
		});
	});

	describe("Event Handling", () => {
		it("handles mouse events", async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();
			const handleMouseEnter = vi.fn();
			const handleMouseLeave = vi.fn();

			render(
				<Button
					onClick={handleClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
				>
					Event Button
				</Button>
			);

			const button = screen.getByRole("button", { name: /event button/i });

			await user.hover(button);
			expect(handleMouseEnter).toHaveBeenCalledTimes(1);

			await user.click(button);
			expect(handleClick).toHaveBeenCalledTimes(1);

			await user.unhover(button);
			expect(handleMouseLeave).toHaveBeenCalledTimes(1);
		});

		it("handles keyboard events", async () => {
			const user = userEvent.setup();
			const handleKeyDown = vi.fn();
			const handleKeyUp = vi.fn();

			render(
				<Button onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
					Keyboard Button
				</Button>
			);

			const button = screen.getByRole("button", { name: /keyboard button/i });
			button.focus();

			await user.keyboard("{ }"); // Space key
			expect(handleKeyDown).toHaveBeenCalled();
			expect(handleKeyUp).toHaveBeenCalled();
		});

		it("handles focus events", async () => {
			const user = userEvent.setup();
			const handleFocus = vi.fn();
			const handleBlur = vi.fn();

			render(
				<Button onFocus={handleFocus} onBlur={handleBlur}>
					Focus Button
				</Button>
			);

			const button = screen.getByRole("button", { name: /focus button/i });

			await user.click(button);
			expect(handleFocus).toHaveBeenCalled();

			await user.tab();
			expect(handleBlur).toHaveBeenCalled();
		});
	});

	describe("Accessibility", () => {
		it("has no accessibility violations", async () => {
			const { container } = render(<Button>Accessible Button</Button>);
			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});

		it("supports custom aria attributes", () => {
			render(
				<Button 
					aria-label="Custom label"
					aria-describedby="description"
					aria-expanded={false}
				>
					Accessible
				</Button>
			);

			const button = screen.getByRole("button", { name: /custom label/i });
			expect(button).toHaveAttribute("aria-label", "Custom label");
			expect(button).toHaveAttribute("aria-describedby", "description");
			expect(button).toHaveAttribute("aria-expanded", "false");
		});

		it("maintains focus management", () => {
			render(<Button>Focusable Button</Button>);
			const button = screen.getByRole("button", { name: /focusable button/i });
			
			expect(button).toHaveClass("focus-visible:outline-none");
			expect(button).toHaveClass("focus-visible:ring-2");
			expect(button).toHaveClass("focus-visible:ring-ring");
		});

		it("has proper keyboard navigation", async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();
			render(<Button onClick={handleClick}>Keyboard Nav</Button>);

			const button = screen.getByRole("button", { name: /keyboard nav/i });
			button.focus();

			// Test Enter key
			await user.keyboard("{Enter}");
			expect(handleClick).toHaveBeenCalledTimes(1);

			// Test Space key
			await user.keyboard("{ }");
			expect(handleClick).toHaveBeenCalledTimes(2);
		});
	});

	describe("Performance", () => {
		it("does not re-render unnecessarily", () => {
			const renderSpy = vi.fn();
			const TestComponent = () => {
				renderSpy();
				return <Button>Performance Test</Button>;
			};

			const { rerender } = render(<TestComponent />);
			expect(renderSpy).toHaveBeenCalledTimes(1);

			// Re-render with same props
			rerender(<TestComponent />);
			expect(renderSpy).toHaveBeenCalledTimes(2);
		});

		it("handles rapid clicks gracefully", async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();
			render(<Button onClick={handleClick}>Rapid Click</Button>);

			const button = screen.getByRole("button", { name: /rapid click/i });

			// Simulate rapid clicks
			for (let i = 0; i < 5; i++) {
				await user.click(button);
			}

			expect(handleClick).toHaveBeenCalledTimes(5);
		});
	});

	describe("Error Handling", () => {
		it("handles missing children gracefully", () => {
			render(<Button />);
			const button = screen.getByRole("button");
			expect(button).toBeInTheDocument();
			expect(button).toHaveTextContent("");
		});

		it("handles invalid icon props gracefully", () => {
			render(
				<Button
					leftIcon={null}
					rightIcon={undefined}
				>
					Invalid Icons
				</Button>
			);
			const button = screen.getByRole("button", { name: /invalid icons/i });
			expect(button).toBeInTheDocument();
		});
	});

	describe("Complex Integration", () => {
		it("works within forms", async () => {
			const user = userEvent.setup();
			const handleSubmit = vi.fn((e) => e.preventDefault());
			render(
				<form onSubmit={handleSubmit}>
					<Button type="submit">Submit Form</Button>
				</form>
			);

			const button = screen.getByRole("button", { name: /submit form/i });
			await user.click(button);
			expect(handleSubmit).toHaveBeenCalledTimes(1);
		});

		it("integrates with tooltip systems", () => {
			render(
				<Button title="Tooltip text" aria-describedby="tooltip-id">
					Tooltip Button
				</Button>
			);

			const button = screen.getByRole("button", { name: /tooltip button/i });
			expect(button).toHaveAttribute("title", "Tooltip text");
			expect(button).toHaveAttribute("aria-describedby", "tooltip-id");
		});

		it("works with complex loading states", async () => {
			const TestComponent = () => {
				const [loading, setLoading] = React.useState(false);
				const handleClick = () => {
					setLoading(true);
					setTimeout(() => setLoading(false), 100);
				};

				return (
					<Button loading={loading} onClick={handleClick}>
						{loading ? "Loading..." : "Click me"}
					</Button>
				);
			};

			const user = userEvent.setup();
			render(<TestComponent />);

			const button = screen.getByRole("button", { name: /click me/i });
			await user.click(button);

			expect(screen.getByRole("button", { name: /loading/i })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /loading/i })).toHaveAttribute("aria-busy", "true");

			await waitFor(() => {
				expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
			}, { timeout: 200 });
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to button element", () => {
			const ref = React.createRef<HTMLButtonElement>();
			render(<Button ref={ref}>Ref Button</Button>);

			expect(ref.current).toBeInstanceOf(HTMLButtonElement);
			expect(ref.current?.textContent).toBe("Ref Button");
		});

		it("forwards ref when using asChild", () => {
			const ref = React.createRef<HTMLAnchorElement>();
			render(
				<Button asChild ref={ref}>
					<a href="#">Ref Link</a>
				</Button>
			);

			expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
			expect(ref.current?.textContent).toBe("Ref Link");
		});
	});

	describe("Edge Cases", () => {
		it("handles extremely long text content", () => {
			const longText = "A".repeat(1000);
			render(<Button>{longText}</Button>);
			const button = screen.getByRole("button");
			expect(button).toBeInTheDocument();
			expect(button).toHaveClass("whitespace-nowrap");
		});

		it("handles special characters in content", () => {
			const specialText = "<>&\"'";
			render(<Button>{specialText}</Button>);
			const button = screen.getByRole("button");
			expect(button).toHaveTextContent(specialText);
		});

		it("handles multiple rapid prop changes", () => {
			const { rerender } = render(<Button variant="default">Test</Button>);
			const button = screen.getByRole("button", { name: /test/i });

			rerender(<Button variant="destructive">Test</Button>);
			expect(button).toHaveClass("bg-destructive");

			rerender(<Button variant="outline" size="lg">Test</Button>);
			expect(button).toHaveClass("border-input", "h-11");

			rerender(<Button variant="ghost" size="sm" disabled>Test</Button>);
			expect(button).toHaveClass("hover:bg-accent", "h-9");
			expect(button).toBeDisabled();
		});
	});
});
