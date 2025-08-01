import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface Task extends Doc<"tasks"> {
  _id: Id<"tasks">;
}

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
}

export function TaskDetailModal({ task, onClose }: TaskDetailModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFile = useMutation(api.files.saveFile);
  const deleteFile = useMutation(api.files.deleteFile);
  const toggleTaskComplete = useMutation(api.tasks.toggleTaskComplete);
  const files = useQuery(api.files.getFilesForTask, { taskId: task._id });

  const currentUser = useQuery(api.auth.loggedInUser);
  const taggedUsers = useQuery(
    api.users.getUsers,
    task.taggedUsers ? { userIds: task.taggedUsers } : "skip"
  );
  const taskCreator = useQuery(
    api.users.getUser,
    task.userId ? { userId: task.userId } : "skip"
  );

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await saveFile({
        storageId,
        fileName: file.name,
        taskId: task._id,
        type: file.type,
      });

      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: Id<"files">) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }
    try {
      await deleteFile({ fileId });
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {task.description || "No description provided."}
              </p>
            </div>

            <hr />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Status</h3>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    task.completed
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {task.completed ? "Completed" : "Pending"}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Priority</h3>
                <span className="capitalize">{task.priority}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Category</h3>
                <span>{task.category}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Due Date</h3>
                <span>
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "Not set"}
                </span>
              </div>
            </div>

            <hr />

            {task.teamId && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">
                  Team & Sharing
                </h3>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Creator</p>
                    <p className="font-medium">
                      {taskCreator?.name || taskCreator?.email}
                    </p>
                  </div>
                  {taggedUsers && taggedUsers.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-500">Tagged</p>
                      <div className="flex flex-wrap gap-2">
                        {taggedUsers.map((user) => (
                          <span
                            key={user?._id}
                            className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm"
                          >
                            {user?.name || user?.email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <hr />

            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Attachments</h3>
              <div className="space-y-3">
                {files?.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <a
                      href={file.url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {file.name}
                    </a>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.url!}
                        download={file.name}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Download file"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDeleteFile(file._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete file"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="auth-button"
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Add Attachment"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end gap-4">
            {currentUser &&
              (task.userId === currentUser._id ||
                task.taggedUsers?.includes(currentUser._id)) && (
                <button
                  onClick={() => toggleTaskComplete({ id: task._id })}
                  className={`px-4 py-2 rounded-lg text-white font-semibold ${
                    task.completed
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {task.completed ? "Mark as Incomplete" : "Mark as Complete"}
                </button>
              )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
