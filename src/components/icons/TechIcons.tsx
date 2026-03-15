// Placeholder for tech icons — can be extended with actual SVG logos
export function TechIcon({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="w-4 h-4 rounded bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-neutral-300">
      {initial}
    </div>
  );
}
