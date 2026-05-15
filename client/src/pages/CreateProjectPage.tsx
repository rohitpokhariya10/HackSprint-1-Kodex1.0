import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { projectSchema, type ProjectValues } from "../features/projects/schemas/projectSchema";
import { useCreateProjectMutation } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { FormInput } from "../shared/components/FormInput";
import { FormTextarea } from "../shared/components/FormTextarea";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [createProject, { isLoading }] = useCreateProjectMutation();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : ""),
    [coverImage]
  );
  const { register, handleSubmit, formState: { errors } } = useForm<ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { status: "published", category: "web app" },
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

      const project = await createProject(payload).unwrap();
      toast.success("Project published");
      navigate(`/projects/${project.data?._id || ""}`);
    } catch {
      toast.error("Could not create project");
    }
  };
  return (
    <ProjectForm
      title="Create Project"
      onSubmit={handleSubmit(onSubmit)}
      register={register}
      errors={errors}
      isLoading={isLoading}
      coverPreview={coverPreview}
      galleryCount={galleryImages.length}
      onCoverChange={setCoverImage}
      onGalleryChange={setGalleryImages}
    />
  );
}

type ProjectFormProps = {
  title: string;
  onSubmit: () => void;
  register: ReturnType<typeof useForm<ProjectValues>>["register"];
  errors: ReturnType<typeof useForm<ProjectValues>>["formState"]["errors"];
  isLoading: boolean;
  coverPreview?: string;
  galleryCount?: number;
  onCoverChange?: (file: File | null) => void;
  onGalleryChange?: (files: File[]) => void;
};

function ProjectForm({ title, onSubmit, register, errors, isLoading, coverPreview, galleryCount = 0, onCoverChange, onGalleryChange }: ProjectFormProps) {
  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
        <Card className="mt-8">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">Cover image</span>
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => onCoverChange?.(event.target.files?.[0] || null)} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300" />
                <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                  {coverPreview ? <img src={coverPreview} className="h-full w-full object-cover" alt="Project cover preview" /> : null}
                </div>
              </label>
              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-300">Gallery images</span>
                <input type="file" multiple accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => onGalleryChange?.(Array.from(event.target.files || []).slice(0, 5))} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300" />
                <p className="mt-3 text-sm text-zinc-500">{galleryCount} image(s) selected. Max 5.</p>
              </label>
            </div>
            <FormInput placeholder="Title" {...register("title")} />{errors.title ? <p className="text-xs text-red-300">{errors.title.message}</p> : null}
            <FormInput placeholder="Short description" {...register("shortDescription")} />
            <FormTextarea placeholder="Description" {...register("description")} />{errors.description ? <p className="text-xs text-red-300">{errors.description.message}</p> : null}
            <FormInput placeholder="Tech stack: React, Node.js, MongoDB" {...register("techStack")} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput placeholder="GitHub link" {...register("githubLink")} />
              <FormInput placeholder="Live link" {...register("liveLink")} />
              <FormInput placeholder="Category" {...register("category")} />
              <select {...register("status")} className="h-11 rounded-xl border border-white/10 bg-zinc-950 px-3 text-sm text-white outline-none transition hover:border-white/20 focus:border-zinc-500 focus:ring-2 focus:ring-white/10"><option value="published">Published</option><option value="draft">Draft</option></select>
            </div>
            <Button disabled={isLoading}>{isLoading ? "Saving..." : "Save Project"}</Button>
          </form>
        </Card>
      </div>
    </Container>
  );
}
