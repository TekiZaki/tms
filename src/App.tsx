import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { TaskManager } from "./components/TaskManager";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow</h1>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </header>

      <main className="flex-1">
        <Content />
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Authenticated>
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back,{" "}
            {loggedInUser?.name ||
              loggedInUser?.email?.split("@")[0] ||
              "there"}
            !
          </h2>
          <p className="text-gray-600">Stay organized and get things done.</p>
        </div>
        <TaskManager />
      </Authenticated>

      <Unauthenticated>
        <div className="max-w-md mx-auto mt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Get Started
            </h2>
            <p className="text-gray-600">
              Sign in to manage your tasks and stay organized.
            </p>
          </div>
          <SignInForm />
        </div>
      </Unauthenticated>
    </div>
  );
}
