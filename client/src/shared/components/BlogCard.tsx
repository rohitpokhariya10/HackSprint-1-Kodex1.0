import { Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { Blog } from "../types/api";
import { formatDate, getUserName } from "../lib/utils";
import { Card } from "../ui/Card";
import { SkillBadge } from "./SkillBadge";

export function BlogCard({ blog }: { blog: Blog }) {
  return (
    <Card className="group overflow-hidden p-0">
      <Link to={`/blogs/${blog.slug || blog._id}`} className="block">
        <div className="aspect-[16/8] bg-zinc-950">
          {blog.coverImage ? (
            <img src={blog.coverImage} alt={blog.title} className="h-full w-full object-cover opacity-90 transition group-hover:scale-[1.03]" />
          ) : (
            <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-400">
              DevHub Blog
            </div>
          )}
        </div>
      </Link>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="font-semibold uppercase tracking-[0.2em] text-zinc-500">{blog.category}</span>
          <span>{formatDate(blog.createdAt)}</span>
        </div>
        <Link to={`/blogs/${blog.slug || blog._id}`}>
          <h3 className="mt-3 line-clamp-2 text-lg font-semibold text-white">{blog.title}</h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{blog.excerpt || blog.content}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {blog.tags?.slice(0, 4).map((tag) => <SkillBadge key={tag} label={tag} />)}
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-zinc-400">
          <span>{getUserName(blog.author)}</span>
          <span className="flex gap-3">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{blog.readTime || 1}m</span>
            <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{blog.views || 0}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
