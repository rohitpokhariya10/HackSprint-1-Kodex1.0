import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useDebounce from "../hooks/useDebounce";
import { useGetBlogsQuery } from "../services/api/baseApi";
import { BlogCard } from "../shared/components/BlogCard";
import { Container } from "../shared/components/Container";
import { EmptyState } from "../shared/components/EmptyState";
import { LoadingSkeleton } from "../shared/components/LoadingSkeleton";
import { SearchBar } from "../shared/components/SearchBar";
import { Button } from "../shared/ui/Button";

export function BlogsPage() {
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim(), 400);
  const debouncedTag = useDebounce(tag.trim(), 400);
  const debouncedCategory = useDebounce(category.trim(), 400);
  const queryParams = useMemo(
    () => ({
      search: debouncedSearch,
      tag: debouncedTag,
      category: debouncedCategory,
      sort,
      page,
      limit: 10,
    }),
    [debouncedSearch, debouncedTag, debouncedCategory, sort, page]
  );
  const { data, isLoading, isFetching, isError, refetch } = useGetBlogsQuery(queryParams);
  const blogs = data?.data || [];
  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedTag, debouncedCategory, sort]);

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Blogs</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Technical library</h1>
        </div>
        <Link to="/blogs/new"><Button>Write Blog</Button></Link>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px_150px]">
        <SearchBar value={search} onChange={setSearch} placeholder="Search blogs by title, tag, category..." />
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 sm:w-40">
          <option value="latest">Latest</option>
          <option value="trending">Trending</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>
      <div className="mt-8">
        {isLoading || isFetching ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div>
            <EmptyState title="Could not load blogs" text="Please check the backend and try again." />
            <Button className="mt-5" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : blogs.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}</div>
        ) : (
          <EmptyState title="No blogs found" />
        )}
      </div>
      {meta ? (
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>Prev</Button>
          <span className="text-sm text-zinc-400">Page {page}</span>
          <Button variant="secondary" disabled={meta.hasNextPage === false} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      ) : null}
    </Container>
  );
}
