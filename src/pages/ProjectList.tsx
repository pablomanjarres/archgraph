import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Boxes, ArrowRight } from "lucide-react";

interface ProjectEntry {
  id: string;
  name: string;
  description: string;
}

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/projects.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load projects");
        return res.json();
      })
      .then(setProjects)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="h-screen w-screen bg-[#141414] flex items-center justify-center">
      <div className="max-w-2xl w-full px-6">
        <div className="flex items-center gap-3 mb-8">
          <Boxes size={28} className="text-neutral-400" />
          <h1 className="text-2xl font-semibold text-white">archgraph</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">
          Architecture diagrams
        </p>

        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        <div className="grid gap-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/${project.id}`}
              className="group flex items-center justify-between p-4 rounded-lg bg-[#1e1e1e] border border-[#333] hover:border-neutral-500 transition-colors"
            >
              <div>
                <h2 className="text-white font-medium">{project.name}</h2>
                <p className="text-neutral-500 text-sm mt-0.5">
                  {project.description}
                </p>
              </div>
              <ArrowRight
                size={16}
                className="text-neutral-600 group-hover:text-neutral-400 transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
