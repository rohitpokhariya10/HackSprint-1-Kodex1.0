import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useGetMyProjectsQuery } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { EmptyState } from "../shared/components/EmptyState";
import { LoadingSkeleton } from "../shared/components/LoadingSkeleton";
import { ProjectCard } from "../shared/components/ProjectCard";
import { Button } from "../shared/ui/Button";

export function MyProjectsPage() {
  const queryParams = useMemo(() => ({ limit: 50 }), []);
  const { data, isLoading, isFetching, isError, refetch } = useGetMyProjectsQuery(queryParams);
  const projects = data?.data || [];

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Workspace</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">My Projects</h1>
        </div>
        <Link to="/projects/new"><Button>Create Project</Button></Link>
      </div>
      <div className="mt-8">
        {isLoading || isFetching ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div>
            <EmptyState title="Could not load your projects" text="Please try again." />
            <Button className="mt-5" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : projects.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
          </div>
        ) : (
          <EmptyState title="No projects yet" text="Create your first project showcase." />
        )}
      </div>
    </Container>
  );
}
