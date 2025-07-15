"use client";

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold tracking-tight">CC Agents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your custom AI agents
          </p>
        </div>
        
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Agents functionality will be migrated here from the existing Vite app.
          </p>
        </div>
      </div>
    </div>
  );
}