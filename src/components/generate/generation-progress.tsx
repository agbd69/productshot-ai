"use client";

import { useEffect, useState } from "react";

import type { GenerationJob } from "@/lib/generation-job";

type GenerationProgressProps = {
  initialJob: GenerationJob;
};

export function GenerationProgress({ initialJob }: GenerationProgressProps) {
  const [job, setJob] = useState(initialJob);

  useEffect(() => {
    if (job.status === "completed" || job.status === "failed") return;

    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/generate/jobs/${job.id}`);
      if (!response.ok) return;
      const payload = (await response.json()) as { job: GenerationJob };
      setJob(payload.job);
    }, 1500);

    return () => window.clearInterval(timer);
  }, [job.id, job.status]);

  return (
    <section className="rounded-lg border border-teal-200/20 bg-teal-200/[0.08] p-6">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-100">{job.status}</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">{job.sceneTitle}</h1>
      <p className="mt-4 max-w-2xl leading-7 text-slate-300">
        Job <span className="font-mono text-teal-100">{job.id.slice(0, 18)}...</span> is using the local mock provider. Real AI generation connects next.
      </p>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-950/60">
        <div className="h-full rounded-full bg-teal-200 transition-all" style={{ width: `${job.progress}%` }} />
      </div>
      <p className="mt-3 text-sm text-slate-300">{job.progress}% complete</p>
      {job.status === "completed" ? <ResultGallery job={job} /> : null}
    </section>
  );
}

function ResultGallery({ job }: { job: GenerationJob }) {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {job.images.map((image, index) => (
        <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3" key={image.id}>
          <div
            className={[
              "flex aspect-[3/4] flex-col justify-end rounded-md p-4",
              index % 3 === 0
                ? "bg-gradient-to-br from-teal-200/25 via-slate-800 to-slate-950"
                : index % 3 === 1
                  ? "bg-gradient-to-br from-blue-200/25 via-slate-800 to-slate-950"
                  : "bg-gradient-to-br from-amber-200/25 via-slate-800 to-slate-950",
            ].join(" ")}
          >
            <p className="text-sm font-medium text-white">{image.label}</p>
            {image.watermark ? <p className="mt-1 text-xs text-slate-300">Watermarked preview</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
