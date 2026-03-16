import type { ArchGraphModel } from "../types/model";

const MODEL_PATHS = ["/model.json", "/sample-model.json"];

export async function loadModel(projectId?: string): Promise<ArchGraphModel> {
  const paths = projectId
    ? [`/models/${projectId}/model.json`]
    : MODEL_PATHS;

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        const data = await res.json();
        validateModel(data);
        return data as ArchGraphModel;
      }
    } catch {
      continue;
    }
  }
  throw new Error(
    "No model found. Place a model.json in your project root or use the /graph skill to generate one.",
  );
}

function validateModel(data: unknown): asserts data is ArchGraphModel {
  if (!data || typeof data !== "object") {
    throw new Error("Model must be a JSON object");
  }
  const model = data as Record<string, unknown>;
  if (model.version !== "1.0.0") {
    throw new Error(`Unsupported model version: ${model.version}`);
  }
  if (!Array.isArray(model.objects)) {
    throw new Error("Model must contain an objects array");
  }
  if (!Array.isArray(model.connections)) {
    throw new Error("Model must contain a connections array");
  }
}
