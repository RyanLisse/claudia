import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { api, type Agent } from "@/lib/api-web";

interface AgentFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  agent?: Agent | null;
}

export default function AgentFormDialog({ open, onClose, onSaved, agent }: AgentFormDialogProps) {
  const isEdit = Boolean(agent);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [description, setDescription] = useState("");
  const [model, setModel] = useState("sonnet");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setSystemPrompt(agent.system_prompt);
      setDescription(agent.description);
      setModel(agent.model);
    } else {
      setName("");
      setSystemPrompt("");
      setDescription("");
      setModel("sonnet");
    }
    setError(null);
  }, [agent, open]);

  const handleSubmit = async () => {
    if (!name.trim() || !systemPrompt.trim()) {
      setError("Name and system prompt are required");
      return;
    }
    try {
      setSaving(true);
      if (isEdit && agent?.id) {
        await api.updateAgent(agent.id, name, "bot", systemPrompt, description, model);
      } else {
        await api.createAgent(name, "bot", systemPrompt, description, model);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Agent" : "Create Agent"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update your agent configuration." : "Provide details for the new agent."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Agent" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system_prompt">System Prompt</Label>
            <Textarea id="system_prompt" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} placeholder="You are a helpful agent..." rows={6} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}