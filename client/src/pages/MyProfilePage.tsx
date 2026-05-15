import { Link } from "react-router-dom";
import { useGetMyProfileQuery } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { EmptyState } from "../shared/components/EmptyState";
import { SkillBadge } from "../shared/components/SkillBadge";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";
import { getUserName } from "../shared/lib/utils";

export function MyProfilePage() {
  const { data, isLoading } = useGetMyProfileQuery();
  const profile = data?.data;
  if (isLoading) return <Container className="py-10 text-zinc-400">Loading profile...</Container>;
  if (!profile) return <Container className="py-10"><EmptyState title="No profile yet" text="Create your profile to get discovered." /><Link to="/profile/setup"><Button className="mt-5">Create Profile</Button></Link></Container>;
  return (
    <Container className="py-10">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="h-56 bg-zinc-950">
          {profile.banner ? <img src={profile.banner} className="h-full w-full object-cover" alt="" /> : null}
        </div>
        <div className="p-6">
          <img src={profile.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${getUserName(profile.user)}`} className="-mt-20 h-32 w-32 rounded-3xl border-4 border-[#050505] object-cover" alt="" />
          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{getUserName(profile.user)}</h1>
              <p className="mt-2 text-zinc-300">{profile.headline}</p>
              <p className="mt-4 max-w-3xl leading-7 text-zinc-400">{profile.bio}</p>
            </div>
            <Link to="/profile/setup"><Button variant="secondary">Edit Profile</Button></Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">{profile.skills?.map((skill) => <SkillBadge key={skill} label={skill} />)}</div>
        </div>
      </div>
    </Container>
  );
}
