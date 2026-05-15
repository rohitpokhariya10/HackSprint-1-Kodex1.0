import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { profileSchema, type ProfileValues } from "../features/profile/schemas/profileSchema";
import { useCreateProfileMutation, useGetMyProfileQuery, useUpdateProfileMutation } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { FormInput } from "../shared/components/FormInput";
import { FormTextarea } from "../shared/components/FormTextarea";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { data } = useGetMyProfileQuery();
  const [createProfile, createState] = useCreateProfileMutation();
  const [updateProfile, updateState] = useUpdateProfileMutation();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const existing = data?.data;
  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : existing?.avatar || ""),
    [avatarFile, existing?.avatar]
  );
  const bannerPreview = useMemo(
    () => (bannerFile ? URL.createObjectURL(bannerFile) : existing?.banner || ""),
    [bannerFile, existing?.banner]
  );
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: {
      headline: existing?.headline || "",
      bio: existing?.bio || "",
      skills: existing?.skills?.join(", ") || "",
      githubUsername: existing?.githubUsername || "",
      location: existing?.location || "",
      portfolio: existing?.socialLinks?.portfolio || "",
      github: existing?.socialLinks?.github || "",
      linkedin: existing?.socialLinks?.linkedin || "",
      twitter: existing?.socialLinks?.twitter || "",
      isOpenToWork: existing?.isOpenToWork || false,
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    const socialLinks = {
        github: values.github,
        portfolio: values.portfolio,
        linkedin: values.linkedin,
        twitter: values.twitter,
    };

    const payload =
      avatarFile || bannerFile
        ? new FormData()
        : {
            headline: values.headline,
            bio: values.bio,
            skills: values.skills,
            githubUsername: values.githubUsername,
            location: values.location,
            isOpenToWork: Boolean(values.isOpenToWork),
            profileVisibility: "public",
            socialLinks,
          };

    if (payload instanceof FormData) {
      payload.append("headline", values.headline);
      payload.append("bio", values.bio);
      payload.append("skills", values.skills);
      payload.append("githubUsername", values.githubUsername || "");
      payload.append("location", values.location || "");
      payload.append("isOpenToWork", String(Boolean(values.isOpenToWork)));
      payload.append("profileVisibility", "public");
      payload.append("socialLinks", JSON.stringify(socialLinks));
      if (avatarFile) payload.append("avatar", avatarFile);
      if (bannerFile) payload.append("banner", bannerFile);
    }

    try {
      if (existing) await updateProfile(payload).unwrap();
      else await createProfile(payload).unwrap();
      toast.success("Profile saved");
      navigate("/profile/me");
    } catch {
      toast.error("Could not save profile");
    }
  };

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Profile setup</h1>
        <p className="mt-3 text-zinc-400">Shape a portfolio-grade developer profile.</p>
        <Card className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-[1fr_160px]">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-300">Banner image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) => setBannerFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300"
                />
                <div className="mt-3 h-32 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                  {bannerPreview ? <img src={bannerPreview} className="h-full w-full object-cover" alt="Banner preview" /> : null}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-zinc-300">Avatar</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300"
                />
                <div className="mt-3 h-32 w-32 overflow-hidden rounded-3xl border border-white/10 bg-zinc-950">
                  {avatarPreview ? <img src={avatarPreview} className="h-full w-full object-cover" alt="Avatar preview" /> : null}
                </div>
              </label>
            </div>
            <FormInput placeholder="Headline" {...register("headline")} />
            {errors.headline ? <p className="text-xs text-red-300">{errors.headline.message}</p> : null}
            <FormTextarea placeholder="Bio" {...register("bio")} />
            {errors.bio ? <p className="text-xs text-red-300">{errors.bio.message}</p> : null}
            <FormInput placeholder="Skills: React, Node.js, MongoDB" {...register("skills")} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput placeholder="GitHub username" {...register("githubUsername")} />
              <FormInput placeholder="Location" {...register("location")} />
              <FormInput placeholder="GitHub URL" {...register("github")} />
              <FormInput placeholder="Portfolio URL" {...register("portfolio")} />
              <FormInput placeholder="LinkedIn URL" {...register("linkedin")} />
              <FormInput placeholder="Twitter/X URL" {...register("twitter")} />
            </div>
            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input type="checkbox" {...register("isOpenToWork")} /> Open to work
            </label>
            <p className="text-xs text-zinc-500">Image upload fields are supported by the backend; URL/file upload UI can be extended from this form without API changes.</p>
            <Button disabled={createState.isLoading || updateState.isLoading}>Save profile</Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
