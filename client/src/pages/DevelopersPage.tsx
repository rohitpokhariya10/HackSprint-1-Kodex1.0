import { useEffect, useState } from "react";
import useDebounce from "../hooks/useDebounce";
import { useGetProfilesQuery } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { EmptyState } from "../shared/components/EmptyState";
import { LoadingSkeleton } from "../shared/components/LoadingSkeleton";
import { SearchBar } from "../shared/components/SearchBar";
import { UserCard } from "../shared/components/UserCard";
import { Button } from "../shared/ui/Button";

export function DevelopersPage() {
  const [searchInput, setSearchInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [openToWork, setOpenToWork] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(searchInput.trim(), 400);
  const debouncedSkill = useDebounce(skillInput.trim(), 400);
  const { data, isLoading, isFetching, isError, refetch } = useGetProfilesQuery({
    search: debouncedSearch,
    skill: debouncedSkill,
    openToWork: openToWork ? true : undefined,
    page,
    limit: 10,
  });
  const profiles = data?.data || [];
  const meta = data?.meta;

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedSkill, openToWork]);

  return (
    <Container className="py-10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Developers
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          Find builders
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-400">
          Search public profiles by keyword, skill, and open-to-work status.
        </p>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
        <SearchBar
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Search developers by name, skill, location..."
        />
        <input
          value={skillInput}
          onChange={(event) => setSkillInput(event.target.value)}
          placeholder="Skill filter"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10"
        />
        <label className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={openToWork}
            onChange={(event) => setOpenToWork(event.target.checked)}
          />
          Open to work
        </label>
      </div>

      <div className="mt-8">
        {isLoading || isFetching ? (
          <LoadingSkeleton />
        ) : isError ? (
          <EmptyState title="Could not load developers" text="Please check the backend and try again." />
        ) : profiles.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <UserCard key={profile._id} profile={profile} />
            ))}
          </div>
        ) : (
          <EmptyState title="No developers found" text="Try a different keyword or skill." />
        )}
      </div>
      {isError ? (
        <Button className="mt-5" variant="secondary" onClick={() => refetch()}>
          Retry
        </Button>
      ) : null}
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
