import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Alert, AlertDescription } from "../src/components/Alert";

describe("Alert", () => {
	afterEach(() => {
		cleanup();
		// Force complete DOM cleanup to prevent test isolation issues
		document.body.innerHTML = '';
		// Also clear any remaining test containers
		const testContainers = document.querySelectorAll('[data-testid], [role="alert"]');
		testContainers.forEach(container => {
			if (container.parentNode) {
				container.parentNode.removeChild(container);
			}
		});
		// Clean up any remaining elements
		while (document.body.firstChild) {
			document.body.removeChild(document.body.firstChild);
		}
	});

	describe("Basic Rendering", () => {
		it("renders correctly with default props", () => {
			render(
				<Alert>
					<AlertDescription>Test alert message default</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toBeInTheDocument();
			expect(alert).toHaveTextContent("Test alert message default");
		});

		it("renders with custom children", () => {
			render(
				<Alert>
					<div data-testid="custom-content">Custom content rendering</div>
				</Alert>
			);
			
			expect(screen.getByTestId("custom-content")).toBeInTheDocument();
			expect(screen.getByText("Custom content rendering")).toBeInTheDocument();
		});

		it("applies correct accessibility attributes", () => {
			render(
				<Alert>
					<AlertDescription>Accessible alert attributes</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveAttribute("role", "alert");
			expect(alert).toHaveAttribute("aria-live", "polite");
		});
	});

	describe("Variants", () => {
		it("renders default variant correctly", () => {
			render(
				<Alert variant="default">
					<AlertDescription>Default alert</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("border-border");
			expect(alert).toHaveClass("bg-background");
		});

		it("renders success variant correctly", () => {
			render(
				<Alert variant="success">
					<AlertDescription>Success alert</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("border-green-500/20");
			expect(alert).toHaveClass("bg-green-500/10");
			expect(alert).toHaveClass("text-green-700");
		});

		it("renders warning variant correctly", () => {
			render(
				<Alert variant="warning">
					<AlertDescription>Warning alert</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("border-yellow-500/20");
			expect(alert).toHaveClass("bg-yellow-500/10");
			expect(alert).toHaveClass("text-yellow-700");
		});

		it("renders error variant correctly", () => {
			render(
				<Alert variant="error">
					<AlertDescription>Error alert</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("border-red-500/20");
			expect(alert).toHaveClass("bg-red-500/10");
			expect(alert).toHaveClass("text-red-700");
		});

		it("renders info variant correctly", () => {
			render(
				<Alert variant="info">
					<AlertDescription>Info alert</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("border-blue-500/20");
			expect(alert).toHaveClass("bg-blue-500/10");
			expect(alert).toHaveClass("text-blue-700");
		});
	});

	describe("Title Functionality", () => {
		it("renders with title", () => {
			render(
				<Alert title="Alert Title">
					<AlertDescription>Alert content</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByText("Alert Title")).toBeInTheDocument();
			expect(screen.getByText("Alert content")).toBeInTheDocument();
		});

		it("renders title with proper styling", () => {
			render(
				<Alert title="Styled Title">
					<AlertDescription>Content</AlertDescription>
				</Alert>
			);
			
			const title = screen.getByText("Styled Title");
			expect(title).toHaveClass("font-medium");
			expect(title).toHaveClass("leading-none");
			expect(title).toHaveClass("tracking-tight");
		});

		it("renders without title when not provided", () => {
			render(
				<Alert>
					<AlertDescription>Just content</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByText("Just content")).toBeInTheDocument();
			expect(screen.queryByRole("heading")).not.toBeInTheDocument();
		});
	});

	describe("Dismissible Functionality", () => {
		it("renders dismiss button when dismissible", () => {
			render(
				<Alert dismissible>
					<AlertDescription>Dismissible alert</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			expect(dismissButton).toBeInTheDocument();
			expect(dismissButton).toHaveAttribute("aria-label", "Dismiss alert");
		});

		it("does not render dismiss button when not dismissible", () => {
			render(
				<Alert>
					<AlertDescription>Non-dismissible alert</AlertDescription>
				</Alert>
			);
			
			expect(screen.queryByRole("button")).not.toBeInTheDocument();
		});

		it("calls onDismiss when dismiss button is clicked", () => {
			const onDismiss = vi.fn();
			render(
				<Alert dismissible onDismiss={onDismiss}>
					<AlertDescription>Dismissible alert</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			fireEvent.click(dismissButton);
			
			expect(onDismiss).toHaveBeenCalledTimes(1);
		});

		it("handles dismiss button keyboard interactions", () => {
			const onDismiss = vi.fn();
			render(
				<Alert dismissible onDismiss={onDismiss}>
					<AlertDescription>Dismissible alert</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			
			// Test Enter key
			fireEvent.keyDown(dismissButton, { key: 'Enter' });
			expect(onDismiss).toHaveBeenCalledTimes(1);
			
			// Test Space key
			fireEvent.keyDown(dismissButton, { key: ' ' });
			expect(onDismiss).toHaveBeenCalledTimes(2);
		});

		it("dismiss button has proper accessibility attributes", () => {
			render(
				<Alert dismissible>
					<AlertDescription>Accessible dismiss</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			expect(dismissButton).toHaveAttribute("aria-label", "Dismiss alert");
			expect(dismissButton).toHaveAttribute("type", "button");
		});
	});

	describe("Icon Integration", () => {
		it("renders with icon children", () => {
			render(
				<Alert>
					<CheckCircle data-testid="check-icon" className="h-4 w-4" />
					<AlertDescription>Alert with icon</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByTestId("check-icon")).toBeInTheDocument();
			expect(screen.getByText("Alert with icon")).toBeInTheDocument();
		});

		it("renders multiple icons correctly", () => {
			render(
				<Alert>
					<AlertCircle data-testid="alert-icon" className="h-4 w-4" />
					<Info data-testid="info-icon" className="h-4 w-4" />
					<AlertDescription>Multiple icons</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
			expect(screen.getByTestId("info-icon")).toBeInTheDocument();
		});

		it("icon sizing works correctly", () => {
			render(
				<Alert>
					<CheckCircle data-testid="sized-icon" className="h-6 w-6" />
					<AlertDescription>Sized icon</AlertDescription>
				</Alert>
			);
			
			const icon = screen.getByTestId("sized-icon");
			expect(icon).toHaveClass("h-6", "w-6");
		});
	});

	describe("Custom Styling", () => {
		it("supports custom className", () => {
			render(
				<Alert className="custom-alert-class">
					<AlertDescription>Custom styled alert</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("custom-alert-class");
		});

		it("merges custom className with default classes", () => {
			render(
				<Alert className="custom-class" variant="success">
					<AlertDescription>Merged classes</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveClass("custom-class");
			expect(alert).toHaveClass("border-green-500/20"); // Default success class
		});

		it("applies custom styles to AlertDescription", () => {
			render(
				<Alert>
					<AlertDescription className="custom-description">
						Custom description styling
					</AlertDescription>
				</Alert>
			);
			
			const description = screen.getByText("Custom description styling");
			expect(description).toHaveClass("custom-description");
		});
	});

	describe("Complex Content", () => {
		it("renders complex HTML content", () => {
			render(
				<Alert>
					<AlertDescription>
						<p>First paragraph</p>
						<ul>
							<li>Item 1</li>
							<li>Item 2</li>
						</ul>
					</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByText("First paragraph")).toBeInTheDocument();
			expect(screen.getByText("Item 1")).toBeInTheDocument();
			expect(screen.getByText("Item 2")).toBeInTheDocument();
		});

		it("handles mixed content types", () => {
			render(
				<Alert title="Mixed Content">
					<CheckCircle data-testid="mixed-icon" className="h-4 w-4" />
					<AlertDescription>
						<strong>Bold text</strong> and <em>italic text</em>
					</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByText("Mixed Content")).toBeInTheDocument();
			expect(screen.getByTestId("mixed-icon")).toBeInTheDocument();
			expect(screen.getByText("Bold text")).toBeInTheDocument();
			expect(screen.getByText("italic text")).toBeInTheDocument();
		});

		it("renders with buttons and interactive elements", () => {
			const buttonClick = vi.fn();
			render(
				<Alert>
					<AlertDescription>
						<span>Alert with action: </span>
						<button 
							onClick={buttonClick}
							data-testid="action-button"
							type="button"
						>
							Click me
						</button>
					</AlertDescription>
				</Alert>
			);
			
			const button = screen.getByTestId("action-button");
			expect(button).toBeInTheDocument();
			
			fireEvent.click(button);
			expect(buttonClick).toHaveBeenCalledTimes(1);
		});
	});

	describe("Error Handling", () => {
		it("handles missing onDismiss gracefully", () => {
			render(
				<Alert dismissible>
					<AlertDescription>No dismiss handler</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			
			// Should not throw error
			expect(() => fireEvent.click(dismissButton)).not.toThrow();
		});

		it("handles invalid variant gracefully", () => {
			render(
				<Alert variant={"invalid" as any}>
					<AlertDescription>Invalid variant</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toBeInTheDocument();
			// Should fall back to default styling
			expect(alert).toHaveClass("border-border");
		});

		it("handles empty content", () => {
			render(<Alert />);
			
			const alert = screen.getByRole("alert");
			expect(alert).toBeInTheDocument();
			expect(alert).toBeEmptyDOMElement();
		});
	});

	describe("Accessibility", () => {
		it("has proper ARIA attributes", () => {
			render(
				<Alert>
					<AlertDescription>ARIA test</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveAttribute("role", "alert");
			expect(alert).toHaveAttribute("aria-live", "polite");
		});

		it("error variant has assertive aria-live", () => {
			render(
				<Alert variant="error">
					<AlertDescription>Error message</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveAttribute("aria-live", "assertive");
		});

		it("dismiss button is keyboard accessible", () => {
			const onDismiss = vi.fn();
			render(
				<Alert dismissible onDismiss={onDismiss}>
					<AlertDescription>Keyboard accessible</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			expect(dismissButton).toHaveAttribute("tabindex", "0");
			
			// Test Tab navigation
			dismissButton.focus();
			expect(dismissButton).toHaveFocus();
		});

		it("screen reader announces alert properly", () => {
			render(
				<Alert variant="error" title="Critical Error">
					<AlertDescription>System failure detected</AlertDescription>
				</Alert>
			);
			
			const alert = screen.getByRole("alert");
			expect(alert).toHaveAttribute("aria-live", "assertive");
			expect(alert).toHaveTextContent("Critical Error");
			expect(alert).toHaveTextContent("System failure detected");
		});
	});

	describe("Event Handling", () => {
		it("handles mouse events on dismiss button", () => {
			const onDismiss = vi.fn();
			render(
				<Alert dismissible onDismiss={onDismiss}>
					<AlertDescription>Mouse event test</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			
			fireEvent.mouseDown(dismissButton);
			fireEvent.mouseUp(dismissButton);
			fireEvent.click(dismissButton);
			
			expect(onDismiss).toHaveBeenCalledTimes(1);
		});

		it("prevents event bubbling on dismiss", () => {
			const onDismiss = vi.fn();
			const onAlertClick = vi.fn();
			
			render(
				<Alert dismissible onDismiss={onDismiss} onClick={onAlertClick}>
					<AlertDescription>Event bubbling test</AlertDescription>
				</Alert>
			);
			
			const dismissButton = screen.getByRole("button", { name: /dismiss/i });
			fireEvent.click(dismissButton);
			
			expect(onDismiss).toHaveBeenCalledTimes(1);
			expect(onAlertClick).not.toHaveBeenCalled();
		});
	});

	describe("Performance", () => {
		it("renders efficiently with many alerts", () => {
			const alerts = Array.from({ length: 100 }, (_, i) => (
				<Alert key={i} variant="info">
					<AlertDescription>Alert {i}</AlertDescription>
				</Alert>
			));
			
			const { container } = render(<div>{alerts}</div>);
			
			expect(container.querySelectorAll('[role="alert"]')).toHaveLength(100);
		});

		it("does not cause memory leaks with event listeners", () => {
			const onDismiss = vi.fn();
			const { unmount } = render(
				<Alert dismissible onDismiss={onDismiss}>
					<AlertDescription>Memory leak test</AlertDescription>
				</Alert>
			);
			
			unmount();
			
			// Component should unmount without errors
			expect(onDismiss).not.toHaveBeenCalled();
		});
	});

	describe("Integration with AlertDescription", () => {
		it("AlertDescription renders correctly", () => {
			render(
				<AlertDescription data-testid="alert-description">
					Description content
				</AlertDescription>
			);
			
			const description = screen.getByTestId("alert-description");
			expect(description).toBeInTheDocument();
			expect(description).toHaveTextContent("Description content");
		});

		it("AlertDescription applies correct styling", () => {
			render(
				<AlertDescription className="custom-desc">
					Styled description
				</AlertDescription>
			);
			
			const description = screen.getByText("Styled description");
			expect(description).toHaveClass("text-sm");
			expect(description).toHaveClass("custom-desc");
		});

		it("works with multiple AlertDescription components", () => {
			render(
				<Alert>
					<AlertDescription>First description</AlertDescription>
					<AlertDescription>Second description</AlertDescription>
				</Alert>
			);
			
			expect(screen.getByText("First description")).toBeInTheDocument();
			expect(screen.getByText("Second description")).toBeInTheDocument();
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref correctly", () => {
			const ref = vi.fn();
			render(
				<Alert ref={ref}>
					<AlertDescription>Ref test</AlertDescription>
				</Alert>
			);
			
			expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
		});

		it("ref points to correct element", () => {
			let alertRef: HTMLDivElement | null = null;
			render(
				<Alert ref={(el) => (alertRef = el)}>
					<AlertDescription>Ref element test</AlertDescription>
				</Alert>
			);
			
			expect(alertRef).toBeInstanceOf(HTMLDivElement);
			expect(alertRef).toHaveAttribute("role", "alert");
		});
	});
});