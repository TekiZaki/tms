import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import { TeamsPage } from "./pages/TeamsPage";
import { TaskManager } from "./components/TaskManager";
import { TeamPage } from "./pages/TeamPage";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <TaskManager />,
      },
      {
        path: "teams",
        element: <TeamsPage />,
      },
      {
        path: "team/:teamId",
        element: <TeamPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <RouterProvider router={router} />
  </ConvexAuthProvider>
);
