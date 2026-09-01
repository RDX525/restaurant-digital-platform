export interface FormUploadResult {
  status: number;
  body: unknown;
}

export function postFormDataWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<FormUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) {
        onProgress(10);
        return;
      }
      const percent = Math.round((event.loaded / event.total) * 90);
      onProgress(Math.min(90, Math.max(1, percent)));
    };

    xhr.onload = () => {
      onProgress(95);
      let body: unknown = null;
      try {
        body = JSON.parse(xhr.responseText) as unknown;
      } catch {
        body = { error: "Upload failed" };
      }
      resolve({ status: xhr.status, body });
    };

    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(formData);
  });
}
