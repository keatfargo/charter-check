import mammoth from "mammoth";

async function parsePdf(data: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const pdfParse = mod.default ?? mod;
  const parsed = await pdfParse(data);
  return (parsed.text ?? "") as string;
}

export async function extractText(filename: string, data: Buffer): Promise<string> {
  const name = filename.toLowerCase();
  if (name.endsWith(".pdf")) {
    return (await parsePdf(data)).trim();
  }
  if (name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer: data });
    return (result.value ?? "").trim();
  }
  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
    return data.toString("utf8").trim();
  }
  throw new Error(
    "Unsupported file type. Use .txt, .md, .pdf, or .docx for charter and transcript.",
  );
}
