import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { blogSchema, type BlogValues } from "../features/blogs/schemas/blogSchema";
import { useGetBlogQuery, useGetMyBlogsQuery, useUpdateBlogMutation } from "../services/api/baseApi";
import { Container } from "../shared/components/Container";
import { FormInput } from "../shared/components/FormInput";
import { FormTextarea } from "../shared/components/FormTextarea";
import { Button } from "../shared/ui/Button";
import { Card } from "../shared/ui/Card";

export function EditBlogPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading: isPublicLoading } = useGetBlogQuery(id);
  const { data: myBlogsData, isLoading: isMyBlogsLoading } = useGetMyBlogsQuery();
  const [updateBlog, { isLoading }] = useUpdateBlogMutation();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const blog = data?.data || myBlogsData?.data?.find((item) => item._id === id || item.slug === id);
  const coverPreview = useMemo(
    () => (coverImage ? URL.createObjectURL(coverImage) : blog?.coverImage || ""),
    [coverImage, blog?.coverImage]
  );
  const { register, handleSubmit } = useForm<BlogValues>({
    resolver: zodResolver(blogSchema),
    values: {
      title: blog?.title || "",
      excerpt: blog?.excerpt || "",
      content: blog?.content || "",
      tags: blog?.tags?.join(", ") || "",
      category: blog?.category || "",
      status: blog?.status || "published",
    },
  });
  const onSubmit = (status: "draft" | "published") => async (values: BlogValues) => {
    try {
      const body = { ...values, status, contentFormat: "markdown" };
      const payload = coverImage ? new FormData() : body;

      if (payload instanceof FormData) {
        Object.entries(body).forEach(([key, value]) => payload.append(key, value));
        if (coverImage) payload.append("coverImage", coverImage);
      }

      const response = await updateBlog({
        id: blog?._id || id,
        body: payload,
      }).unwrap();
      const updatedBlog = response.data;
      toast.success(status === "draft" ? "Draft saved" : "Blog published");

      if (status === "draft") {
        navigate(`/blogs/${updatedBlog?._id || blog?._id || id}/edit`);
        return;
      }

      navigate(`/blogs/${updatedBlog?.slug || blog?.slug || id}`);
    } catch {
      toast.error(status === "draft" ? "Could not save draft" : "Could not publish blog");
    }
  };

  if (isPublicLoading || isMyBlogsLoading) {
    return <Container className="py-10 text-zinc-400">Loading editor...</Container>;
  }

  if (!blog) {
    return <Container className="py-10 text-zinc-400">Blog not found or you do not have access to edit it.</Container>;
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">Edit Blog</h1>
        <Card className="mt-8">
          <form className="grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-semibold text-zinc-300">Cover image</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(event) => setCoverImage(event.target.files?.[0] || null)} className="w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-zinc-300" />
              <div className="mt-3 aspect-[16/7] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                {coverPreview ? <img src={coverPreview} className="h-full w-full object-cover" alt="Blog cover preview" /> : null}
              </div>
            </label>
            <FormInput placeholder="Title" {...register("title")} />
            <FormInput placeholder="Excerpt" {...register("excerpt")} />
            <FormTextarea placeholder="Markdown content" rows={12} {...register("content")} />
            <div className="grid gap-4 md:grid-cols-2">
              <FormInput placeholder="Tags" {...register("tags")} />
              <FormInput placeholder="Category" {...register("category")} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="secondary" disabled={isLoading} onClick={handleSubmit(onSubmit("draft"))}>Save Draft</Button>
              <Button type="button" disabled={isLoading} onClick={handleSubmit(onSubmit("published"))}>Publish</Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
}
