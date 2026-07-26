import { Button } from "@/components/ui/button";
import { RealGenerationProgress } from "@/components/generate/real-generation-progress";

export default async function GenerationJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="space-y-8">
      <RealGenerationProgress generationId={id} />
      <div className="flex gap-3">
        <Button href="/create">再生成一组</Button>
        <Button href="/generations" variant="outline">查看历史</Button>
      </div>
    </div>
  );
}
