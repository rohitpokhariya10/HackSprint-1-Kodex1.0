import { BookOpen, FolderKanban, Plus, UserRound } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetMyBlogsQuery, useGetMyProfileQuery, useGetProjectsQuery, useMeQuery } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { EmptyState } from "../shared/components/EmptyState";
import { Card } from "../shared/ui/Card";

const actions = [
  { to: "/profile/me", title: "My Profile", icon: UserRound },
  { to: "/dashboard/projects", title: "My Projects", icon: FolderKanban },
  { to: "/dashboard/blogs", title: "My Blogs", icon: BookOpen },
  { to: "/projects/new", title: "Create Project", icon: Plus },
  { to: "/blogs/new", title: "Write Blog", icon: Plus },
];

export function DashboardPage() {
  const projectPreviewParams = useMemo(() => ({ limit: 3 }), []);
  const { data: me } = useMeQuery();
  const { data: profile } = useGetMyProfileQuery();
  const { data: projects } = useGetProjectsQuery(projectPreviewParams);
  const { data: blogs } = useGetMyBlogsQuery();
  const user = me?.data || me?.user;

  return (
    <Container className="py-10">
      <div className="mb-6 rounded-2xl border border-white/10 bg-neutral-950 p-5 sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Dashboard</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Welcome, {user?.name || "builder"}</h1>
        <p className="mt-3 max-w-2xl text-zinc-400">Ship projects, polish your portfolio, and keep your DevHub presence alive.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {actions.map((action) => (
          <Link key={action.title} to={action.to}>
            <Card className="h-full">
              <action.icon className="h-5 w-5 text-zinc-500" />
              <h3 className="mt-4 text-base font-semibold text-white">{action.title}</h3>
            </Card>
          </Link>
        ))}
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold text-white">Profile status</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {profile?.data ? profile.data.headline || "Your profile is ready." : "Create your profile to appear in discovery."}
          </p>
          <Link className="mt-5 inline-block text-sm font-semibold text-zinc-300" to="/profile/setup">Update profile</Link>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-white">Project pulse</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{projects?.data?.length || 0} recent projects loaded from the community.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-white">Writing desk</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{blogs?.data?.length || 0} blogs in your workspace.</p>
        </Card>
      </div>
      {!profile?.data ? (
        <div className="mt-8">
          <EmptyState
            title="Your profile needs a spark"
            text="Add your bio, skills, projects, and social links to appear in discovery."
            actionLabel="Complete Profile"
            actionTo="/profile/setup"
          />
        </div>
      ) : null}
    </Container>
  );
}
