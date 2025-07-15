import { fireEvent, render, screen } from "@testing-library/react";
import { Heart } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../src/components/Button";

describe("Button", () => {
	it("renders correctly", () => {
		render(<Button>Click me</Button>);
		expect(
			screen.getByRole("button", { name: /click me/i }),
		).toBeInTheDocument();
	});

	it("handles click events", () => {
		const handleClick = vi.fn();
		render(<Button onClick={handleClick}>Click me</Button>);

		fireEvent.click(screen.getByRole("button"));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("shows loading state", () => {
		render(<Button loading>Loading</Button>);

		const button = screen.getByRole("button");
		expect(button).toHaveAttribute("aria-busy");
		expect(button.getAttribute("aria-busy")).toBe("true");
		expect(button).toBeDisabled();
		expect(screen.getByRole("button")).toHaveTextContent("Loading");
	});

	it("is disabled when disabled prop is true", () => {
		render(<Button disabled>Disabled</Button>);

		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("renders with left icon", () => {
		render(
			<Button leftIcon={<Heart data-testid="heart-icon" />}>With Icon</Button>,
		);

		expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("With Icon");
	});

	it("renders with right icon", () => {
		render(
			<Button rightIcon={<Heart data-testid="heart-icon" />}>With Icon</Button>,
		);

		expect(screen.getByTestId("heart-icon")).toBeInTheDocument();
		expect(screen.getByRole("button")).toHaveTextContent("With Icon");
	});

	it("applies correct variant classes", () => {
		const { rerender } = render(<Button variant="destructive">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("bg-destructive");

		rerender(<Button variant="outline">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("border-input");

		rerender(<Button variant="ghost">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("hover:bg-accent");
	});

	it("applies correct size classes", () => {
		const { rerender } = render(<Button size="sm">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-9");

		rerender(<Button size="lg">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-11");

		rerender(<Button size="icon">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("h-10", "w-10");
	});

	it("supports custom className", () => {
		render(<Button className="custom-class">Test</Button>);
		expect(screen.getByRole("button")).toHaveClass("custom-class");
	});

	it("forwards ref correctly", () => {
		const ref = vi.fn();
		render(<Button ref={ref}>Test</Button>);
		expect(ref).toHaveBeenCalled();
	});

	it("has proper accessibility attributes", () => {
		render(<Button aria-label="Custom label">Test</Button>);
		expect(screen.getByRole("button")).toHaveAttribute(
			"aria-label",
			"Custom label",
		);
	});

	it("prevents click when loading", () => {
		const handleClick = vi.fn();
		render(
			<Button loading onClick={handleClick}>
				Loading
			</Button>,
		);

		fireEvent.click(screen.getByRole("button"));
		expect(handleClick).not.toHaveBeenCalled();
	});
});
