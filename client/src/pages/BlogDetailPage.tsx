import ReactMarkdown from "react-markdown";
import { Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAppSelector } from "../app/hooks";
import {
  useDeleteBlogMutation,
  useGetBlogQuery,
  useMeQuery,
} from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { SkillBadge } from "../shared/components/SkillBadge";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";
import { formatDate, getUserId, getUserName } from "../shared/lib/utils";

export function BlogDetailPage() {
  const { idOrSlug = "" } = useParams();
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const { data, isLoading, isFetching, isError, refetch } = useGetBlogQuery(idOrSlug);
  const { data: me } = useMeQuery(undefined, { skip: auth.status === "unauthenticated" });
  const [deleteBlog] = useDeleteBlogMutation();
  const blog = data?.data;
  const user = auth.user || me?.data || me?.user;
  const isOwner = user?._id && blog && getUserId(blog.author) === user._id;

  if (isLoading || isFetching) {
    return <Container className="py-10 text-zinc-400">Loading blog...</Container>;
  }

  if (isError || !blog) {
    return (
      <Container className="grid min-h-[60vh] place-items-center py-10 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Not found
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Blog not found or not published
          </h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Draft blogs are private and can only be opened from your dashboard.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/blogs">
              <Button variant="secondary">Back to Blogs</Button>
            </Link>
            <Link to="/blogs/my">
              <Button>Go to Dashboard Blogs</Button>
            </Link>
            <Button variant="ghost" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Delete this blog?")) return;
    await deleteBlog(blog._id).unwrap();
    toast.success("Blog deleted");
    navigate("/blogs");
  };

  return (
    <Container className="py-10">
      <article className="mx-auto max-w-4xl">
        {blog.coverImage ? (
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="mb-8 aspect-[16/8] w-full rounded-3xl object-cover"
          />
        ) : null}
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          {blog.category}
        </p>
        <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {blog.title}
        </h1>
        <p className="mt-4 text-zinc-400">
          By {getUserName(blog.author)} - {formatDate(blog.createdAt)} -{" "}
          {blog.readTime || 1} min read
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {blog.tags?.map((tag) => <SkillBadge key={tag} label={tag} />)}
        </div>
        {isOwner ? (
          <div className="mt-6 flex gap-3">
            <Link to={`/blogs/${blog._id}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        ) : null}
        <Card className="prose prose-invert prose-zinc mt-8 max-w-none leading-8 text-zinc-200">
          <ReactMarkdown>{blog.content || ""}</ReactMarkdown>
        </Card>
      </article>
    </Container>
  );
}
