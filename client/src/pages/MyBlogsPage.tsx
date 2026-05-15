import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useDeleteBlogMutation, useGetMyBlogsQuery } from "../services/api/baseApi";
import type { Blog } from "../shared/types/api";
import { Container } from "../shared/components/Container";
import { EmptyState } from "../shared/components/EmptyState";
import { LoadingSkeleton } from "../shared/components/LoadingSkeleton";
import { SkillBadge } from "../shared/components/SkillBadge";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";
import { formatDate } from "../shared/lib/utils";

type BlogStatusTab = "all" | "draft" | "published";

export function MyBlogsPage() {
  const [status, setStatus] = useState<BlogStatusTab>("all");
  const queryParams = useMemo(() => (status === "all" ? undefined : { status }), [status]);
  const { data, isLoading, isFetching, isError, refetch } = useGetMyBlogsQuery(queryParams);
  const [deleteBlog] = useDeleteBlogMutation();
  const blogs = data?.data || [];

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this blog?")) return;
    await deleteBlog(id).unwrap();
    toast.success("Blog deleted");
  };

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
            Workspace
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            My Blogs
          </h1>
        </div>
        <Link to="/blogs/new">
          <Button>Write Blog</Button>
        </Link>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        {(["all", "draft", "published"] as BlogStatusTab[]).map((item) => (
          <Button
            key={item}
            variant={status === item ? "primary" : "secondary"}
            onClick={() => setStatus(item)}
          >
            {item === "all" ? "All" : item === "draft" ? "Drafts" : "Published"}
          </Button>
        ))}
      </div>
      <div className="mt-8">
        {isLoading || isFetching ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div>
            <EmptyState title="Could not load your blogs" text="Please try again." />
            <Button className="mt-5" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : blogs.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <MyBlogCard key={blog._id} blog={blog} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <EmptyState title="No blogs yet" text="Write your first technical story." />
        )}
      </div>
    </Container>
  );
}

function MyBlogCard({ blog, onDelete }: { blog: Blog; onDelete: (id: string) => void }) {
  const isPublished = blog.status === "published";

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold capitalize text-zinc-200">
          {blog.status || "published"}
        </span>
        <span className="text-xs text-zinc-500">{formatDate(blog.updatedAt || blog.createdAt)}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-lg font-semibold text-white">{blog.title}</h3>
      <p className="mt-2 text-sm text-zinc-300">{blog.category}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {blog.tags?.slice(0, 4).map((tag) => <SkillBadge key={tag} label={tag} />)}
      </div>
      <div className="mt-6 grid gap-2">
        {isPublished ? (
          <Link to={`/blogs/${blog.slug || blog._id}`}>
            <Button className="w-full" variant="secondary">View</Button>
          </Link>
        ) : null}
        <Link to={`/blogs/${blog._id}/edit`}>
          <Button className="w-full">{isPublished ? "Edit" : "Continue Editing"}</Button>
        </Link>
        <Button className="w-full" variant="danger" onClick={() => onDelete(blog._id)}>
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
      </div>
    </Card>
  );
}
