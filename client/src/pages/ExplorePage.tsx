import { useMemo, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import useDebounce from "../hooks/useDebounce";
import { useGetBlogsQuery, useGetProfilesQuery, useGetProjectsQuery } from "../services/api/baseApi";
import { BlogCard } from "../shared/components/BlogCard";
import { Container } from "../shared/components/Container";
import { ProjectCard } from "../shared/components/ProjectCard";
import { SearchBar } from "../shared/components/SearchBar";
import { UserCard } from "../shared/components/UserCard";
import { Button } from "../shared/ui/Button";
import type { ExploreTab } from "../features/search/types";

export function ExplorePage() {
  const [tab, setTab] = useState<ExploreTab>("developers");
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("");
  const [openToWork, setOpenToWork] = useState(false);
  const [tech, setTech] = useState("");
  const [projectSort, setProjectSort] = useState("latest");
  const [tag, setTag] = useState("");
  const [category, setCategory] = useState("");
  const [blogSort, setBlogSort] = useState("latest");
  const debouncedSearch = useDebounce(search.trim(), 400);
  const debouncedSkill = useDebounce(skill.trim(), 400);
  const debouncedTech = useDebounce(tech.trim(), 400);
  const debouncedTag = useDebounce(tag.trim(), 400);
  const debouncedCategory = useDebounce(category.trim(), 400);
  const profileParams = useMemo(
    () => ({
      search: debouncedSearch,
      skill: debouncedSkill,
      openToWork: openToWork ? true : undefined,
      limit: 10,
    }),
    [debouncedSearch, debouncedSkill, openToWork]
  );
  const projectParams = useMemo(
    () => ({
      search: debouncedSearch,
      tech: debouncedTech,
      sort: projectSort,
      limit: 10,
    }),
    [debouncedSearch, debouncedTech, projectSort]
  );
  const blogParams = useMemo(
    () => ({
      search: debouncedSearch,
      tag: debouncedTag,
      category: debouncedCategory,
      sort: blogSort,
      limit: 10,
    }),
    [debouncedSearch, debouncedTag, debouncedCategory, blogSort]
  );
  const profiles = useGetProfilesQuery(
    tab === "developers" ? profileParams : skipToken
  );
  const projects = useGetProjectsQuery(
    tab === "projects" ? projectParams : skipToken
  );
  const blogs = useGetBlogsQuery(
    tab === "blogs" ? blogParams : skipToken
  );

  const isLoading =
    tab === "developers" ? profiles.isLoading || profiles.isFetching :
    tab === "projects" ? projects.isLoading || projects.isFetching :
    blogs.isLoading || blogs.isFetching;
  const isError =
    tab === "developers" ? profiles.isError :
    tab === "projects" ? projects.isError :
    blogs.isError;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Explore DevHub</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">Search developers, projects, and blogs from one polished discovery space.</p>
      <div className="mt-8"><SearchBar value={search} onChange={setSearch} placeholder="Search everything..." /></div>
      <div className="mt-5 flex flex-wrap gap-3">{(["developers", "projects", "blogs"] as ExploreTab[]).map((item) => <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>{item}</Button>)}</div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {tab === "developers" ? (
          <>
            <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Skill: react" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10" />
            <label className="flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-300"><input type="checkbox" checked={openToWork} onChange={(e) => setOpenToWork(e.target.checked)} /> Open to work</label>
          </>
        ) : null}
        {tab === "projects" ? (
          <>
            <input value={tech} onChange={(e) => setTech(e.target.value)} placeholder="Tech: react" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10" />
            <select value={projectSort} onChange={(e) => setProjectSort(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 sm:w-56"><option value="latest">Latest</option><option value="trending">Trending</option></select>
          </>
        ) : null}
        {tab === "blogs" ? (
          <>
            <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag: react" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10" />
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10" />
            <select value={blogSort} onChange={(e) => setBlogSort(e.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10 sm:w-56"><option value="latest">Latest</option><option value="trending">Trending</option></select>
          </>
        ) : null}
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? <p className="text-zinc-400">Loading results...</p> : null}
        {isError ? <p className="text-red-300">Something went wrong while loading results.</p> : null}
        {tab === "developers" ? profiles.data?.data?.map((profile) => <UserCard key={profile._id} profile={profile} />) : null}
        {tab === "projects" ? projects.data?.data?.map((project) => <ProjectCard key={project._id} project={project} />) : null}
        {tab === "blogs" ? blogs.data?.data?.map((blog) => <BlogCard key={blog._id} blog={blog} />) : null}
      </div>
    </Container>
  );
}
