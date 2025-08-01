import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";

export function TeamsPage() {
  const myTeams = useQuery(api.tasks.getMyTeams) || [];
  const createTeam = useMutation(api.tasks.createTeam);
  const joinTeam = useMutation(api.tasks.joinTeam);

  const [newTeamName, setNewTeamName] = useState("");
  const [inviteToken, setInviteToken] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) {
      toast.error("Please enter a team name.");
      return;
    }
    setIsCreating(true);
    try {
      await createTeam({ name: newTeamName });
      toast.success(`Team "${newTeamName}" created!`);
      setNewTeamName("");
    } catch (error) {
      toast.error("Failed to create team.");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      toast.error("Please enter an invite token.");
      return;
    }
    setIsJoining(true);
    try {
      await joinTeam({ inviteToken });
      toast.success("Successfully joined team!");
      setInviteToken("");
    } catch (error: any) {
      toast.error(error.message || "Failed to join team.");
      console.error(error);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">My Teams</h2>
        {myTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTeams.map((team) => (
              <Link
                key={team._id}
                to={`/team/${team._id}`}
                className="block card p-6 hover-lift"
              >
                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Owner: {team.isOwner ? "You" : "Someone else"}
                </p>
                <div className="mt-4">
                  <span className="text-blue-600 font-medium hover:underline">
                    View Tasks →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">
            You are not a part of any team yet. Create one or join one below.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Create a New Team
          </h3>
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team Name"
              className="auth-input-field"
              disabled={isCreating}
            />
            <button type="submit" className="auth-button" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Team"}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Join a Team</h3>
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <input
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value.toUpperCase())}
              placeholder="Invite Token"
              className="auth-input-field"
              disabled={isJoining}
            />
            <button type="submit" className="auth-button" disabled={isJoining}>
              {isJoining ? "Joining..." : "Join with Token"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
