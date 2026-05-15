import { Code2, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppSelector } from "../app/hooks";
import { useDeleteProjectMutation, useGetProjectQuery, useMeQuery } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { SkillBadge } from "../shared/components/SkillBadge";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";
import { getUserId, getUserName } from "../shared/lib/utils";

export function ProjectDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const { data } = useGetProjectQuery(id);
  const { data: me } = useMeQuery(undefined, { skip: auth.status === "unauthenticated" });
  const [deleteProject] = useDeleteProjectMutation();
  const project = data?.data;
  const user = auth.user || me?.data || me?.user;
  const isOwner = user?._id && project && getUserId(project.owner) === user._id;
  if (!project) return <Container className="py-10 text-zinc-400">Loading project...</Container>;
  const handleDelete = async () => {
    if (!confirm("Delete this project?")) return;
    await deleteProject(project._id).unwrap();
    toast.success("Project deleted");
    navigate("/projects");
  };
  return (
    <Container className="py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">{project.coverImage ? <img src={project.coverImage} className="aspect-[16/8] w-full object-cover" alt={project.title} /> : null}</div>
          <h1 className="mt-8 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{project.title}</h1>
          <p className="mt-4 leading-8 text-zinc-400">{project.description}</p>
          <div className="mt-6 flex flex-wrap gap-2">{project.techStack?.map((tech) => <SkillBadge key={tech} label={tech} />)}</div>
          {project.images?.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {project.images.map((image) => (
                <img key={image} src={image} alt={project.title} className="aspect-video rounded-2xl border border-white/10 object-cover" />
              ))}
            </div>
          ) : null}
        </div>
        <Card className="h-fit">
          <p className="text-sm text-zinc-400">By {getUserName(project.owner)}</p>
          <p className="mt-2 text-sm text-zinc-500">{project.views || 0} views</p>
          <div className="mt-5 grid gap-3">
            {project.githubLink ? <a href={project.githubLink} target="_blank" rel="noreferrer"><Button variant="secondary" className="w-full"><Code2 className="h-4 w-4" /> GitHub</Button></a> : null}
            {project.liveLink ? <a href={project.liveLink} target="_blank" rel="noreferrer"><Button className="w-full"><ExternalLink className="h-4 w-4" /> Live Project</Button></a> : null}
            {isOwner ? (
              <>
                <Link to={`/projects/${project._id}/edit`}><Button variant="secondary" className="w-full"><Pencil className="h-4 w-4" /> Edit</Button></Link>
                <Button variant="danger" className="w-full" onClick={handleDelete}><Trash2 className="h-4 w-4" /> Delete</Button>
              </>
            ) : null}
          </div>
        </Card>
      </div>
    </Container>
  );
}
