import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { projectSchema, type ProjectValues } from "../features/projects/schemas/projectSchema";
import { useGetProjectQuery, useUpdateProjectMutation } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { FormInput } from "../shared/components/FormInput";
import { FormTextarea } from "../shared/components/FormTextarea";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";
import { getApiErrorMessage } from "../shared/lib/apiError";

export function EditProjectPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data } = useGetProjectQuery(id);
  const [updateProject, { isLoading }] = useUpdateProjectMutation();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const project = data?.data;
  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : project?.coverImage || ""),
    [coverImage, project?.coverImage]
  );
  const { register, handleSubmit } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    values: {
      title: project?.title || "",
      shortDescription: project?.shortDescription || "",
      description: project?.description || "",
      techStack: project?.techStack?.join(", ") || "",
      githubLink: project?.githubLink || "",
      liveLink: project?.liveLink || "",
      category: project?.category || "web app",
      status: project?.status || "published",
    },
  });
  const onSubmit = async (values: ProjectValues) => {
    try {
      const payload =
        coverImage || galleryImages.length
          ? new FormData()
          : values;

      if (payload instanceof FormData) {
        Object.entries(values).forEach(([key, value]) => payload.append(key, value));
        if (coverImage) payload.append("coverImage", coverImage);
        galleryImages.forEach((image) => payload.append("images", image));
      }

      await updateProject({ id, body: payload }).unwrap();
      toast.success("Project updated");
      navigate(`/projects/${id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update project"));
    }
  };
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Edit Project</h1>
        <Card className="mt-8">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">Replace cover image</span>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => setCoverImage(event.target.files?.[0] || null)} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300" />
                <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                  {coverPreview ? <img src={coverPreview} className="h-full w-full object-cover" alt="Project cover preview" /> : null}
                </div>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">Replace gallery images</span>
                <input type="file" multiple accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => setGalleryImages(Array.from(event.target.files || []).slice(0, 5))} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300" />
                <p className="mt-3 text-sm text-zinc-500">{galleryImages.length || project?.images?.length || 0} image(s).</p>
              </label>
            </div>
            <FormInput placeholder="Title" {...register("title")} />
            <FormInput placeholder="Short description" {...register("shortDescription")} />
            <FormTextarea placeholder="Description" {...register("description")} />
            <FormInput placeholder="Tech stack" {...register("techStack")} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput placeholder="GitHub link" {...register("githubLink")} />
              <FormInput placeholder="Live link" {...register("liveLink")} />
              <FormInput placeholder="Category" {...register("category")} />
              <select {...register("status")} className="h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10"><option value="published">Published</option><option value="draft">Draft</option></select>
            </div>
            <Button disabled={isLoading}>Update Project</Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
