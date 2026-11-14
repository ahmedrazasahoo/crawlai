// Optional in-browser ML check, loaded only when the user clicks the button.
// This module is imported dynamically from the Text tab so the model library
// never enters the main bundle and never runs during server rendering.
//
// It uses Transformers.js (@huggingface/transformers) to run a RoBERTa based
// detector that was converted to ONNX by the Xenova project. The underlying
// model, OpenAI's RoBERTa base detector, was trained in the GPT-2 era, with a
// ChatGPT era sibling trained on the HC3 dataset. Both are known to be weak
// on modern model output, so the result is shown as a separate, clearly
// labelled signal and never replaces the main heuristic report.

export const ML_MODEL_ID = "Xenova/roberta-base-openai-detector";
export const ML_MODEL_LABEL = "RoBERTa base OpenAI detector (Xenova ONNX build)";

export interface MlResult {
  model: string;
  label: string;
  aiProbability: number;
  humanProbability: number;
  truncated: boolean;
}

type ProgressInfo = {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
};

export async function runMlDetector(
  text: string,
  onProgress?: (message: string) => void
): Promise<MlResult> {
  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;

  const classifier = await pipeline("text-classification", ML_MODEL_ID, {
    progress_callback: (info: ProgressInfo) => {
      if (!onProgress) return;
      if (info.status === "downloading" && typeof info.progress === "number") {
        onProgress(
          `Downloading model file ${info.file ?? ""}: ${Math.round(info.progress)}%`
        );
      } else if (info.status === "loading") {
        onProgress("Loading the model into the browser...");
      } else if (info.status === "ready") {
        onProgress("Model ready, scoring the text...");
      }
    },
  });

  // The model accepts a limited input length, so long text is scored on its
  // opening section and the report says so.
  const truncated = text.length > 1800;
  const sample = truncated ? text.slice(0, 1800) : text;

  const raw = (await classifier(sample, { top_k: 5 })) as
    | { label: string; score: number }
    | { label: string; score: number }[];
  const results = Array.isArray(raw) ? raw : [raw];

  // Label wording differs between builds. Treat anything mentioning fake,
  // generated, or ai as the AI side, and the top remaining label as human.
  const aiEntry = results.find((r) =>
    /fake|generated|ai|label_1/i.test(r.label)
  );
  const humanEntry =
    results.find((r) => /real|human|label_0/i.test(r.label)) ??
    results.find((r) => r !== aiEntry);

  let aiProbability: number;
  if (aiEntry) {
    aiProbability = aiEntry.score * 100;
  } else if (humanEntry) {
    aiProbability = (1 - humanEntry.score) * 100;
  } else {
    throw new Error("The model returned a result shape this tool cannot read.");
  }

  return {
    model: ML_MODEL_LABEL,
    label: aiEntry?.label ?? humanEntry?.label ?? "unknown",
    aiProbability: Math.round(aiProbability),
    humanProbability: Math.round(100 - aiProbability),
    truncated,
  };
}
