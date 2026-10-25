import type { HandlerEvent } from "@netlify/functions";
import Busboy from "busboy";

export type MultipartFile = {
  field: string;
  filename: string;
  data: Buffer;
  mimeType: string;
};

export function parseMultipart(event: HandlerEvent): Promise<MultipartFile[]> {
  return new Promise((resolve, reject) => {
    const contentType = event.headers["content-type"] || event.headers["Content-Type"];
    if (!contentType?.includes("multipart/form-data")) {
      reject(new Error("Expected multipart/form-data"));
      return;
    }

    const files: MultipartFile[] = [];
    const busboy = Busboy({
      headers: { "content-type": contentType },
    });

    busboy.on("file", (field, file, info) => {
      const chunks: Buffer[] = [];
      file.on("data", (chunk: Buffer) => chunks.push(chunk));
      file.on("end", () => {
        files.push({
          field,
          filename: info.filename,
          mimeType: info.mimeType,
          data: Buffer.concat(chunks),
        });
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => resolve(files));

    const body = event.isBase64Encoded
      ? Buffer.from(event.body ?? "", "base64")
      : Buffer.from(event.body ?? "", "utf8");
    busboy.end(body);
  });
}
