import { describe, expect, it } from "vitest";
import {
	add,
	Calculator,
	divide,
	getStatus,
	greet,
	isEven,
	multiply,
} from "../src/test-helper";

describe("Test Helper Functions", () => {
	describe("add", () => {
		it("should add two positive numbers", () => {
			expect(add(2, 3)).toBe(5);
		});

		it("should add negative numbers", () => {
			expect(add(-2, -3)).toBe(-5);
		});

		it("should handle zero", () => {
			expect(add(0, 5)).toBe(5);
			expect(add(5, 0)).toBe(5);
		});
	});

	describe("multiply", () => {
		it("should multiply two numbers", () => {
			expect(multiply(3, 4)).toBe(12);
		});

		it("should handle zero", () => {
			expect(multiply(0, 5)).toBe(0);
		});

		it("should handle negative numbers", () => {
			expect(multiply(-2, 3)).toBe(-6);
		});
	});

	describe("divide", () => {
		it("should divide two numbers", () => {
			expect(divide(10, 2)).toBe(5);
		});

		it("should handle negative numbers", () => {
			expect(divide(-10, 2)).toBe(-5);
		});

		it("should throw error for division by zero", () => {
			expect(() => divide(10, 0)).toThrow("Division by zero");
		});
	});

	describe("greet", () => {
		it("should greet with name", () => {
			expect(greet("Alice")).toBe("Hello, Alice!");
		});

		it("should return default greeting for empty name", () => {
			expect(greet("")).toBe("Hello, World!");
		});
	});

	describe("isEven", () => {
		it("should return true for even numbers", () => {
			expect(isEven(2)).toBe(true);
			expect(isEven(0)).toBe(true);
			expect(isEven(-2)).toBe(true);
		});

		it("should return false for odd numbers", () => {
			expect(isEven(1)).toBe(false);
			expect(isEven(3)).toBe(false);
			expect(isEven(-1)).toBe(false);
		});
	});

	describe("getStatus", () => {
		it("should return correct status for different scores", () => {
			expect(getStatus(95)).toBe("excellent");
			expect(getStatus(85)).toBe("good");
			expect(getStatus(75)).toBe("average");
			expect(getStatus(65)).toBe("below average");
			expect(getStatus(55)).toBe("poor");
		});

		it("should handle edge cases", () => {
			expect(getStatus(90)).toBe("excellent");
			expect(getStatus(80)).toBe("good");
			expect(getStatus(70)).toBe("average");
			expect(getStatus(60)).toBe("below average");
		});
	});

	describe("Calculator", () => {
		it("should add numbers and track history", () => {
			const calc = new Calculator();
			expect(calc.add(2, 3)).toBe(5);
			expect(calc.getHistory()).toEqual(["2 + 3 = 5"]);
		});

		it("should subtract numbers and track history", () => {
			const calc = new Calculator();
			expect(calc.subtract(5, 3)).toBe(2);
			expect(calc.getHistory()).toEqual(["5 - 3 = 2"]);
		});

		it("should track multiple operations", () => {
			const calc = new Calculator();
			calc.add(1, 2);
			calc.subtract(5, 3);
			expect(calc.getHistory()).toEqual(["1 + 2 = 3", "5 - 3 = 2"]);
		});

		it("should clear history", () => {
			const calc = new Calculator();
			calc.add(1, 2);
			calc.clearHistory();
			expect(calc.getHistory()).toEqual([]);
		});
	});
});
