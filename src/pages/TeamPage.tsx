import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { TaskManager } from "../components/TaskManager";

export function TeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const generateInviteToken = useMutation(api.teams.generateInviteToken);

  // A query to get team details might be useful here, for now, we just use the ID
  // const team = useQuery(api.teams.get, { id: teamId as Id<"teams"> });

  const handleInvite = async () => {
    try {
      const token = await generateInviteToken({
        teamId: teamId as Id<"teams">,
      });
      await navigator.clipboard.writeText(token);
      toast.success("Invite token copied to clipboard!");
    } catch (error) {
      toast.error("Failed to generate invite token.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Team Tasks</h2>
          <p className="text-gray-600">Manage tasks for this team.</p>
        </div>
        <button onClick={handleInvite} className="auth-button">
          Generate Invite Token
        </button>
      </div>

      <TaskManager teamId={teamId as Id<"teams">} />
    </div>
  );
}
