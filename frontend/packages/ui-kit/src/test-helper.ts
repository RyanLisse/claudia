/**
 * Test helper utilities for coverage testing
 */

export function add(a: number, b: number): number {
	return a + b;
}

export function multiply(a: number, b: number): number {
	return a * b;
}

export function divide(a: number, b: number): number {
	if (b === 0) {
		throw new Error("Division by zero");
	}
	return a / b;
}

export function greet(name: string): string {
	if (!name) {
		return "Hello, World!";
	}
	return `Hello, ${name}!`;
}

export function isEven(num: number): boolean {
	return num % 2 === 0;
}

export function getStatus(score: number): string {
	if (score >= 90) return "excellent";
	if (score >= 80) return "good";
	if (score >= 70) return "average";
	if (score >= 60) return "below average";
	return "poor";
}

export class Calculator {
	private history: string[] = [];

	add(a: number, b: number): number {
		const result = a + b;
		this.history.push(`${a} + ${b} = ${result}`);
		return result;
	}

	subtract(a: number, b: number): number {
		const result = a - b;
		this.history.push(`${a} - ${b} = ${result}`);
		return result;
	}

	getHistory(): string[] {
		return [...this.history];
	}

	clearHistory(): void {
		this.history = [];
	}
}
