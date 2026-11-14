"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { getSupabase, PHOTO_BUCKET, supabaseConfigured } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/types";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export default function CreateListingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState<"idle" | "uploading" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please choose an image file (JPEG, PNG, WebP or GIF).");
      e.target.value = "";
      return;
    }
    if (selected.size > MAX_IMAGE_BYTES) {
      setError("That image is too large. The limit is 8 MB.");
      e.target.value = "";
      return;
    }
    setFile(selected);
  }

  function clearImage() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanEmail = email.trim();
    const numericPrice = Number(price);

    if (cleanTitle.length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (!cleanDescription) {
      setError("Please add a description.");
      return;
    }
    if (price.trim() === "" || Number.isNaN(numericPrice) || numericPrice < 0) {
      setError("Enter a valid price (0 or more).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid contact email.");
      return;
    }
    if (!supabaseConfigured) {
      setError(
        "Supabase is not configured. Add your URL and anon key to .env.local.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabase();
      let imageUrl: string | null = null;

      if (file) {
        setStage("uploading");
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw new Error(
            `Photo upload failed: ${uploadError.message}. Make sure the "${PHOTO_BUCKET}" storage bucket exists and is public.`,
          );
        }
        imageUrl = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path)
          .data.publicUrl;
      }

      setStage("saving");
      const { error: insertError } = await supabase.from("listings").insert({
        title: cleanTitle,
        description: cleanDescription,
        price: numericPrice,
        email: cleanEmail,
        category,
        image_url: imageUrl,
      });

      if (insertError) {
        throw new Error(
          insertError.message.includes("relation") ||
            insertError.message.includes("schema cache")
            ? `The listings table was not found. Run supabase/schema.sql in your Supabase SQL editor.`
            : `Could not save listing: ${insertError.message}`,
        );
      }

      sessionStorage.setItem("marketplace:created", "1");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
      setStage("idle");
      setSubmitting(false);
    }
  }

  const busy = submitting;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-bold text-fb-blue hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to marketplace
      </Link>

      <div className="border border-fb-border bg-white">
        <div className="border-b border-fb-border bg-[#f7f8fa] px-5 py-4">
          <h1 className="text-xl font-bold text-fb-text">Create a Listing</h1>
          <p className="mt-0.5 text-xs text-fb-muted">
            Describe what you&apos;re selling. Items usually get a response
            within a day.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label htmlFor="title" className="mb-1 block text-xs font-bold">
              Title <span className="text-fb-blue">*</span>
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage denim jacket, size M"
              maxLength={120}
              className="field"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="mb-1 block text-xs font-bold">
                Price (USD) <span className="text-fb-blue">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fb-muted">
                  $
                </span>
                <input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="field pl-7"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1 block text-xs font-bold"
              >
                Category <span className="text-fb-blue">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="field"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-xs font-bold"
            >
              Description <span className="text-fb-blue">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Condition, dimensions, pickup details, anything a buyer should know…"
              maxLength={2000}
              className="field resize-y"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-bold">
              Contact email <span className="text-fb-blue">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="field"
              required
            />
            <p className="mt-1 text-[11px] text-fb-muted">
              Shown on your listing so buyers can reach you.
            </p>
          </div>

          <div>
            <span className="mb-1 block text-xs font-bold">Photo</span>
            {preview ? (
              <div className="relative border border-fb-border bg-[#f4f5f7] p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Listing preview"
                  className="mx-auto max-h-72 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={busy}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                  Remove
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-fb-border bg-[#fafbfc] px-4 py-10 text-center transition-colors hover:border-fb-blue hover:bg-[#f4f6fa]"
              >
                <ImagePlus
                  className="h-8 w-8 text-fb-muted"
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-fb-text">
                  Click to upload a photo
                </span>
                <span className="text-[11px] text-fb-muted">
                  JPEG, PNG, WebP or GIF — up to 8 MB
                </span>
                <input
                  ref={fileInputRef}
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}

            {preview && (
              <div className="mt-2">
                <label
                  htmlFor="photo-replace"
                  className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-fb-blue hover:underline"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  Choose a different photo
                  <input
                    id="photo-replace"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-fb-border pt-4">
            <Link href="/" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="h-4 w-4" aria-hidden="true" />
              )}
              {stage === "uploading"
                ? "Uploading photo…"
                : stage === "saving"
                  ? "Publishing…"
                  : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
