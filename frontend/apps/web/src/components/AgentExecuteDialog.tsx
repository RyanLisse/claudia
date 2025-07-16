import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { api, type Agent } from "@/lib/api-web";

interface AgentExecuteDialogProps {
  open: boolean;
  onClose: () => void;
  agent: Agent | null;
  onExecuted: () => void;
}

export default function AgentExecuteDialog({ open, onClose, agent, onExecuted }: AgentExecuteDialogProps) {
  const [projectPath, setProjectPath] = useState("");
  const [task, setTask] = useState(agent?.default_task || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!agent?.id) return;
    if (!projectPath.trim()) {
      setError("Project path is required");
      return;
    }
    try {
      setSaving(true);
      await api.executeAgent(agent.id, projectPath, task, agent.model);
      onExecuted();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to execute agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Execute Agent</DialogTitle>
          <DialogDescription>
            Run "{agent?.name}" on a project path
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-2">
            <Input placeholder="/absolute/project/path" value={projectPath} onChange={(e) => setProjectPath(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Input placeholder="Task (optional)" value={task} onChange={(e) => setTask(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleExecute} disabled={saving || !projectPath.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Execute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}