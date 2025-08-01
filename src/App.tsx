import {
  Authenticated,
  Unauthenticated,
  useQuery,
  useConvexAuth,
} from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Outlet, Link, NavLink } from "react-router-dom";

export default function App() {
  const { isLoading } = useConvexAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            TaskFlow
          </Link>
          <Authenticated>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-4">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `text-gray-600 hover:text-gray-900 font-medium ${
                      isActive ? "text-blue-600" : ""
                    }`
                  }
                >
                  My Tasks
                </NavLink>
                <NavLink
                  to="/teams"
                  className={({ isActive }) =>
                    `text-gray-600 hover:text-gray-900 font-medium ${
                      isActive ? "text-blue-600" : ""
                    }`
                  }
                >
                  Teams
                </NavLink>
              </nav>
              <SignOutButton />
            </div>
          </Authenticated>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <Authenticated>
              <Outlet />
            </Authenticated>
          )}

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
      </main>

      <Toaster position="top-right" />
    </div>
  );
}
