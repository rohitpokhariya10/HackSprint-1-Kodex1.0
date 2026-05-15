import { useParams } from "react-router-dom";
import { useGetProfileByUserIdQuery } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { SkillBadge } from "../shared/components/SkillBadge";
import { Card } from "../shared/ui/Card";
import { getUserName } from "../shared/lib/utils";

export function PublicProfilePage() {
  const { userId = "" } = useParams();
  const { data, isLoading } = useGetProfileByUserIdQuery(userId);
  const profile = data?.data;
  if (isLoading) return <Container className="py-10 text-zinc-400">Loading profile...</Container>;
  if (!profile) return <Container className="py-10 text-zinc-400">Profile not found.</Container>;
  return (
    <Container className="py-10">
      <Card className="overflow-hidden p-0">
        <div className="h-56 bg-zinc-950">{profile.banner ? <img src={profile.banner} className="h-full w-full object-cover" alt="" /> : null}</div>
        <div className="p-6">
          <img src={profile.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${getUserName(profile.user)}`} className="-mt-20 h-32 w-32 rounded-3xl border-4 border-[#050505] object-cover" alt="" />
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">{getUserName(profile.user)}</h1>
          <p className="mt-2 text-zinc-300">{profile.headline}</p>
          <p className="mt-4 max-w-3xl leading-7 text-zinc-400">{profile.bio}</p>
          <div className="mt-6 flex flex-wrap gap-2">{profile.skills?.map((skill) => <SkillBadge key={skill} label={skill} />)}</div>
        </div>
      </Card>
    </Container>
  );
}
