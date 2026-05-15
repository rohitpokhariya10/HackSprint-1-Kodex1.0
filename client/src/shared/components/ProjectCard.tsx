import { Code2, Eye, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { Project } from "../types/api";
import { getUserName } from "../lib/utils";
import { Card } from "../ui/Card";
import { SkillBadge } from "./SkillBadge";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className="group overflow-hidden p-0">
      <Link to={`/projects/${project._id}`} className="block">
        <div className="aspect-[16/9] bg-zinc-950">
          {project.coverImage ? (
            <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-400">
              DevHub Project
            </div>
          )}
        </div>
      </Link>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {project.category || "web app"}
        </p>
        <Link to={`/projects/${project._id}`}>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-white">{project.title}</h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
          {project.shortDescription || project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {project.techStack?.slice(0, 4).map((tech) => <SkillBadge key={tech} label={tech} />)}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-zinc-400">
          <span>{getUserName(project.owner)}</span>
          <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{project.views || 0}</span>
        </div>
        <div className="mt-4 flex gap-2">
          {project.githubLink ? (
            <a href={project.githubLink} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white">
              <Code2 className="h-4 w-4" />
            </a>
          ) : null}
          {project.liveLink ? (
            <a href={project.liveLink} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/[0.03] p-2 text-zinc-300 transition hover:bg-white/10 hover:text-white">
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
