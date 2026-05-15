import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../shared/layouts/MainLayout";
import { ProtectedRoute } from "../shared/components/ProtectedRoute";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProfileSetupPage } from "../pages/ProfileSetupPage";
import { MyProfilePage } from "../pages/MyProfilePage";
import { PublicProfilePage } from "../pages/PublicProfilePage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { CreateProjectPage } from "../pages/CreateProjectPage";
import { EditProjectPage } from "../pages/EditProjectPage";
import { BlogsPage } from "../pages/BlogsPage";
import { BlogDetailPage } from "../pages/BlogDetailPage";
import { CreateBlogPage } from "../pages/CreateBlogPage";
import { EditBlogPage } from "../pages/EditBlogPage";
import { MyBlogsPage } from "../pages/MyBlogsPage";
import { ExplorePage } from "../pages/ExplorePage";
import { DevelopersPage } from "../pages/DevelopersPage";
import { MyProjectsPage } from "../pages/MyProjectsPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "explore", element: <ExplorePage /> },
      { path: "discover", element: <ExplorePage /> },
      { path: "developers", element: <DevelopersPage /> },
      { path: "developers/:userId", element: <PublicProfilePage /> },
      { path: "projects", element: <ProjectsPage /> },
      { path: "projects/:id", element: <ProjectDetailPage /> },
      { path: "blogs", element: <BlogsPage /> },
      { path: "blogs/my", element: <ProtectedRoute />, children: [{ index: true, element: <MyBlogsPage /> }] },
      { path: "blogs/:idOrSlug", element: <BlogDetailPage /> },
      { path: "profiles/:userId", element: <PublicProfilePage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "dashboard/blogs", element: <MyBlogsPage /> },
          { path: "dashboard/projects", element: <MyProjectsPage /> },
          { path: "profile/setup", element: <ProfileSetupPage /> },
          { path: "profile/edit", element: <ProfileSetupPage /> },
          { path: "profile/me", element: <MyProfilePage /> },
          { path: "projects/new", element: <CreateProjectPage /> },
          { path: "projects/:id/edit", element: <EditProjectPage /> },
          { path: "blogs/new", element: <CreateBlogPage /> },
          { path: "blogs/:id/edit", element: <EditBlogPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
