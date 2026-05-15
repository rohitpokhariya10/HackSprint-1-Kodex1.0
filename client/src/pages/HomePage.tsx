import { motion } from "framer-motion";
import { BookOpen, Compass, FolderKanban, Search, UserRound } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useGetBlogsQuery, useGetProjectsQuery } from "../services/api/baseApi";
import { BlogCard } from "../shared/components/BlogCard";
import { Container } from "../shared/components/Container";
import { ProjectCard } from "../shared/components/ProjectCard";
import { SectionHeader } from "../shared/components/SectionHeader";
import { Card } from "../shared/ui/Card";
import { Button } from "../shared/ui/Button";

const features = [
  { title: "Developer Profiles", icon: UserRound, text: "Create a public profile with bio, skills, socials, and portfolio links." },
  { title: "Project Showcase", icon: FolderKanban, text: "Upload projects with tech stack, GitHub links, live demos, and descriptions." },
  { title: "Technical Blogs", icon: BookOpen, text: "Write and publish technical blogs with categories and tags." },
  { title: "Search & Discovery", icon: Compass, text: "Search developers, projects, and blogs by skills, stack, and keywords." },
];

const steps = [
  {
    title: "Create your profile",
    text: "Add your headline, bio, skills, socials, and portfolio links.",
  },
  {
    title: "Add projects and blogs",
    text: "Show real work with project pages and publish technical writing.",
  },
  {
    title: "Get discovered",
    text: "Appear in searchable developer, project, and blog discovery views.",
  },
];

export function HomePage() {
  const trendingProjectParams = useMemo(() => ({ sort: "trending", limit: 3 }), []);
  const latestBlogParams = useMemo(() => ({ sort: "latest", limit: 3 }), []);
  const { data: projectData } = useGetProjectsQuery(trendingProjectParams);
  const { data: blogData } = useGetBlogsQuery(latestBlogParams);
  const projects = projectData?.data || [];
  const blogs = blogData?.data || [];

  return (
    <>
      <section className="relative overflow-hidden pt-16 pb-10 sm:pt-24 lg:pt-28">
        <Container className="relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm font-semibold text-zinc-200">
              Developer Social Platform
            </div>
            <h1 className="mx-auto max-w-4xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Build your developer identity. Share projects. Publish ideas.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              DevHub helps developers create portfolios, showcase projects, write technical blogs, and get discovered by the community.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/developers"><Button size="lg">Explore Developers</Button></Link>
              <Link to="/projects/new"><Button size="lg" variant="secondary">Share a Project</Button></Link>
            </div>
            <p className="mt-5 text-sm font-medium text-zinc-500">
              Portfolio • Projects • Blogs • Discovery
            </p>
          </motion.div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <SectionHeader
            eyebrow="Platform"
            title="Everything a developer community needs"
            description="A focused workspace for presenting your work and finding other builders."
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }}>
                <Card className="h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <feature.icon className="h-5 w-5 text-zinc-200" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{feature.text}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <SectionHeader eyebrow="Workflow" title="How DevHub works" />
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <Card key={step.title} className="h-full">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white text-sm font-bold text-zinc-950">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">{step.text}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Preview</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                A clear product experience for discovery
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
                DevHub combines profile, project, and blog discovery into one searchable interface so your work is easier to inspect during demos and hiring conversations.
              </p>
            </div>

            <Card className="p-4 sm:p-5">
              <div className="rounded-xl border border-white/10 bg-zinc-950 px-4 py-3">
                <div className="flex items-center gap-3 text-zinc-500">
                  <Search className="h-4 w-4" />
                  <span className="text-sm">Search React developers, AI projects, backend blogs...</span>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">M</div>
                  <h3 className="mt-4 text-sm font-semibold text-white">MERN Developer</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">React, Node.js, MongoDB, REST APIs</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <FolderKanban className="h-4 w-4" /> Project
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">AI Fitness Coach</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">Full-stack app with live demo and GitHub links.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <BookOpen className="h-4 w-4" /> Blog
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-white">JWT Auth Explained</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">Tagged guide for access tokens and refresh cookies.</p>
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <Card className="flex flex-col items-start justify-between gap-6 p-7 sm:p-8 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">Get Started</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ready to showcase your work?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Create your DevHub profile and turn your projects, blogs, and skills into a portfolio-ready presence.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/dashboard"><Button className="w-full sm:w-auto">Go to Dashboard</Button></Link>
              <Link to="/discover"><Button className="w-full sm:w-auto" variant="secondary">Explore First</Button></Link>
            </div>
          </Card>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <SectionHeader eyebrow="Trending" title="Projects getting attention" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <SectionHeader eyebrow="Latest writing" title="Technical stories from builders" />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)}
          </div>
        </Container>
      </section>
    </>
  );
}
