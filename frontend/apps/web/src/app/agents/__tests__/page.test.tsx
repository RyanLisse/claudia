import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AgentsPage from "../page";
import { vi } from "vitest";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock lucide icons used
vi.mock("lucide-react", () => new Proxy({}, { get: () => () => <div /> }));

// Mock shadcn/ui components that use portal logic if needed
vi.mock("@/components/ui/dialog", async () => {
  const actual: any = await vi.importActual("@/components/ui/dialog");
  return {
    ...actual,
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
  };
});

// Mock api-web
vi.mock("@/lib/api-web", () => {
  return {
    api: {
      listAgents: vi.fn().mockResolvedValue([]),
      listAgentRuns: vi.fn().mockResolvedValue([]),
      createAgent: vi.fn().mockResolvedValue({ id: 1, name: "Test", icon: "bot", system_prompt: "", description: "", model: "sonnet", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      updateAgent: vi.fn(),
      deleteAgent: vi.fn(),
      executeAgent: vi.fn().mockResolvedValue(123),
    },
  };
});

// Mock dependent ui components not critical
vi.mock("@/components/agent-dashboard", () => ({ AgentDashboard: () => <div data-testid="dashboard" /> }));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardFooter: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock("@/components/ui/textarea", () => ({ Textarea: (props: any) => <textarea {...props} /> }));

vi.mock("@/components/ui/input", () => ({ Input: (props: any) => <input {...props} /> }));

vi.mock("@/components/ui/label", () => ({ Label: ({ children, ...props }: any) => <label {...props}>{children}</label> }));

vi.mock("@/components/ui/button", () => ({ Button: ({ children, onClick, ...props }: any) => <button onClick={onClick} {...props}>{children}</button> }));


describe("AgentsPage", () => {
  it("creates a new agent", async () => {
    const { api } = await import("@/lib/api-web");
    render(<AgentsPage />);

    // Click New Agent button
    const newBtn = await screen.findByText(/new agent/i);
    fireEvent.click(newBtn);

    // Fill form
    const nameInput = await screen.findByPlaceholderText(/my agent/i);
    fireEvent.change(nameInput, { target: { value: "MyAgent" } });

    const promptTextarea = await screen.findByPlaceholderText(/you are a helpful agent/i);
    fireEvent.change(promptTextarea, { target: { value: "Be helpful" } });

    const saveBtn = await screen.findByText(/save/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.createAgent).toHaveBeenCalledWith("MyAgent", "bot", "Be helpful", "", "sonnet");
    });
  });
});