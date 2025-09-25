"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { FormTextField } from "@/components/FormTextField";
import { reviewCreateSchema } from "@/lib/validation";

interface ReviewFormProps {
  productId: string;
}

interface FormValues {
  authorName: string;
  title: string;
  body: string;
  rating: string;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const INITIAL_VALUES: FormValues = {
  authorName: "",
  title: "",
  body: "",
  rating: "5"
};

export function ReviewForm({ productId }: ReviewFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (key: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((previous) => ({ ...previous, [key]: event.target.value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);

    const validation = reviewCreateSchema.safeParse({
      productId,
      authorName: values.authorName,
      title: values.title,
      body: values.body,
      rating: Number(values.rating)
    });

    if (!validation.success) {
      const fieldErrors: FormErrors = {};
      const flattened = validation.error.flatten().fieldErrors;
      if (flattened.authorName?.[0]) fieldErrors.authorName = flattened.authorName[0];
      if (flattened.title?.[0]) fieldErrors.title = flattened.title[0];
      if (flattened.body?.[0]) fieldErrors.body = flattened.body[0];
      if (flattened.rating?.[0]) fieldErrors.rating = flattened.rating[0];
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data)
      });
      if (!response.ok) {
        throw new Error("Request failed");
      }
      setValues(INITIAL_VALUES);
      router.refresh();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormTextField
        label="Your name"
        name="authorName"
        value={values.authorName}
        onChange={handleChange("authorName")}
        disabled={isSubmitting}
        error={errors.authorName}
        placeholder="Jane Doe"
      />
      <FormTextField
        label="Title"
        name="title"
        value={values.title}
        onChange={handleChange("title")}
        disabled={isSubmitting}
        error={errors.title}
        placeholder="Fantastic quality"
      />
      <label className="flex flex-col gap-1 text-sm font-medium text-slate-700" htmlFor="body">
        Review
        <textarea
          id="body"
          name="body"
          value={values.body}
          onChange={handleChange("body")}
          disabled={isSubmitting}
          rows={4}
          className="rounded-md border border-slate-300 px-3 py-2 text-base font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          placeholder="Tell us about your experience"
        />
        {errors.body ? <span className="text-xs text-red-600">{errors.body}</span> : null}
      </label>
      <div className="flex flex-col gap-1 text-sm font-medium text-slate-700">
        <label htmlFor="rating">Rating</label>
        <select
          id="rating"
          name="rating"
          value={values.rating}
          onChange={(event) => setValues((previous) => ({ ...previous, rating: event.target.value }))}
          disabled={isSubmitting}
          className="rounded-md border border-slate-300 px-3 py-2 text-base font-normal text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        {errors.rating ? <span className="text-xs text-red-600">{errors.rating}</span> : null}
      </div>
      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
