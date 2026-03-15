import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useGraphStore } from "../../store/useGraphStore";
import { TechPill } from "./TechPill";
import { ConnectionsList } from "./ConnectionsList";

type Tab = "details" | "connections";

const STATUS_COLORS: Record<string, string> = {
  live: "bg-green-500/20 text-green-400",
  future: "bg-blue-500/20 text-blue-400",
  deprecated: "bg-red-500/20 text-red-400",
};

const TYPE_COLORS: Record<string, string> = {
  actor: "bg-purple-500/20 text-purple-400",
  system: "bg-blue-500/20 text-blue-400",
  app: "bg-teal-500/20 text-teal-400",
  store: "bg-amber-500/20 text-amber-400",
  component: "bg-zinc-500/20 text-zinc-400",
};

export function DetailPanel() {
  const selectedObjectId = useGraphStore((s) => s.selectedObjectId);
  const model = useGraphStore((s) => s.model);
  const selectObject = useGraphStore((s) => s.selectObject);
  const [activeTab, setActiveTab] = useState<Tab>("details");

  if (!selectedObjectId || !model) return null;

  const obj = model.objects.find((o) => o.id === selectedObjectId);
  if (!obj) return null;

  const connections = model.connections.filter(
    (c) => c.sourceId === obj.id || c.targetId === obj.id,
  );

  const groups = model.groups.filter((g) => g.objectIds.includes(obj.id));

  return (
    <div className="w-80 border-l border-[#333] bg-[#1e1e1e] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#333]">
        <h2 className="font-semibold text-sm truncate">{obj.name}</h2>
        <button
          onClick={() => selectObject(null)}
          className="p-1 rounded hover:bg-neutral-700 text-neutral-400"
        >
          <X size={16} />
        </button>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b border-[#333]">
        <p className="text-xs text-neutral-400">{obj.description}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#333]">
        {(["details", "connections"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
              activeTab === tab
                ? "text-white border-b-2 border-blue-500"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab}
            {tab === "connections" && ` (${connections.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "details" && (
          <>
            {/* Type + Scope + Status */}
            <div className="space-y-2">
              <DetailRow label="Type">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[obj.type]}`}
                >
                  {obj.type}
                </span>
              </DetailRow>
              <DetailRow label="Scope">
                <span className="text-xs text-neutral-300 capitalize">
                  {obj.scope}
                </span>
              </DetailRow>
              <DetailRow label="Status">
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[obj.status]}`}
                >
                  {obj.status}
                </span>
              </DetailRow>
            </div>

            {/* Groups */}
            {groups.length > 0 && (
              <div>
                <h3 className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5">
                  Groups
                </h3>
                <div className="flex flex-wrap gap-1">
                  {groups.map((g) => (
                    <span
                      key={g.id}
                      className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-400"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technologies */}
            {obj.technologies && obj.technologies.length > 0 && (
              <div>
                <h3 className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-1">
                  {obj.technologies.map((tech) => (
                    <TechPill key={tech.id} tech={tech} />
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {obj.tags && obj.tags.length > 0 && (
              <div>
                <h3 className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1">
                  {obj.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-[11px] px-2 py-0.5 rounded-full border"
                      style={{
                        borderColor: tag.color ?? "#555",
                        color: tag.color ?? "#aaa",
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {obj.links && obj.links.length > 0 && (
              <div>
                <h3 className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5">
                  Links
                </h3>
                <div className="space-y-1">
                  {obj.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink size={12} />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed Description */}
            {obj.detailedDescription && (
              <div>
                <h3 className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1.5">
                  Documentation
                </h3>
                <p className="text-xs text-neutral-400 whitespace-pre-wrap">
                  {obj.detailedDescription}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "connections" && (
          <ConnectionsList
            connections={connections}
            objects={model.objects}
            currentObjectId={obj.id}
          />
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-neutral-500">{label}</span>
      {children}
    </div>
  );
}
