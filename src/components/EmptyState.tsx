import { FileQuestion } from "lucide-react";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-neutral-500">
      <FileQuestion size={48} strokeWidth={1} />
      <p className="text-sm max-w-md text-center">{message}</p>
    </div>
  );
}
