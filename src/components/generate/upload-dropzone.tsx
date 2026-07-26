"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

export function UploadDropzone({ files, onFilesChange }: { files: File[]; onFilesChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const invalid = incoming.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (invalid) {
      setError("请上传 JPG、PNG 或 WebP 格式的照片。");
      return;
    }
    setError(files.length + incoming.length > 6 ? "最多只能上传 6 张照片，已自动保留前 6 张。" : null);
    onFilesChange([...files, ...incoming].slice(0, 6));
  }

  return (
    <section>
      <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.04] p-5">
        <input accept="image/jpeg,image/png,image/webp" className="hidden" multiple onChange={(event) => event.target.files && addFiles(event.target.files)} ref={inputRef} type="file" />
        <ImagePlus className="mb-4 size-6 text-teal-200" />
        <h2 className="text-xl font-semibold text-white">上传 1-6 张自拍</h2>
        <p className="mt-2 text-sm text-slate-300">建议使用清晰、近期、正脸照片，效果会更稳定。</p>
        <Button className="mt-4" onClick={() => inputRef.current?.click()} type="button" variant="outline">选择照片</Button>
      </div>
      {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
      {files.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {files.map((file, index) => (
            <div className="relative rounded-lg border border-white/10 bg-slate-950/60 p-2" key={`${file.name}-${index}`}>
              <button className="absolute right-1 top-1 grid size-7 place-items-center rounded-md bg-slate-950/80" onClick={() => onFilesChange(files.filter((_, i) => i !== index))} type="button">
                <X className="size-4" />
              </button>
              <div className="aspect-[3/4] rounded-md bg-gradient-to-br from-teal-200/20 via-slate-800 to-slate-950" />
              <p className="mt-2 truncate text-xs text-slate-300">{file.name}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
