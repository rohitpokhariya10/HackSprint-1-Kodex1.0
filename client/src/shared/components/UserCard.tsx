import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Profile } from "../types/api";
import { getUserName, getUserId } from "../lib/utils";
import { Card } from "../ui/Card";
import { SkillBadge } from "./SkillBadge";

export function UserCard({ profile }: { profile: Profile }) {
  const userId = getUserId(profile.user);
  return (
    <Card className="overflow-hidden p-0">
      <div className="h-24 bg-zinc-950">
        {profile.banner ? <img src={profile.banner} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="p-5">
        <div className="-mt-12 flex items-end gap-4">
          <img
            src={profile.avatar || `https://api.dicebear.com/8.x/initials/svg?seed=${getUserName(profile.user)}`}
            alt={getUserName(profile.user)}
            className="h-20 w-20 rounded-2xl border-4 border-[#050505] object-cover"
          />
          {profile.isOpenToWork ? <span className="mb-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">Open to work</span> : null}
        </div>
        <Link to={userId ? `/profiles/${userId}` : "#"}>
          <h3 className="mt-4 text-lg font-semibold text-white">{getUserName(profile.user)}</h3>
        </Link>
        <p className="mt-1 text-sm text-zinc-300">{profile.headline || "Developer"}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">{profile.bio || "Building and sharing work on DevHub."}</p>
        {profile.location ? <p className="mt-3 flex items-center gap-2 text-sm text-zinc-500"><MapPin className="h-4 w-4" />{profile.location}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {profile.skills?.slice(0, 5).map((skill) => <SkillBadge key={skill} label={skill} />)}
        </div>
      </div>
    </Card>
  );
}
