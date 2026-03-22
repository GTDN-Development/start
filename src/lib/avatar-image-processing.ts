const DEFAULT_TARGET_FILE_SIZE_MB = 0.9;
const DEFAULT_MAX_IMAGE_DIMENSION = 1024;

export type PrepareAvatarUploadErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "IMAGE_PROCESSING_FAILED";

export type PrepareAvatarUploadResult =
  | {
      ok: true;
      file: File;
    }
  | {
      ok: false;
      errorCode: PrepareAvatarUploadErrorCode;
    };

type PrepareAvatarUploadOptions = {
  maxFileSizeBytes: number;
  targetFileSizeMb?: number;
  maxImageDimension?: number;
};

export async function prepareAvatarUpload(
  file: File,
  options: PrepareAvatarUploadOptions
): Promise<PrepareAvatarUploadResult> {
  if (!isImageFile(file)) {
    return {
      ok: false,
      errorCode: "INVALID_FILE_TYPE",
    };
  }

  if (file.size <= options.maxFileSizeBytes) {
    return {
      ok: true,
      file,
    };
  }

  try {
    const imageCompression = await loadImageCompression();
    const optimizedFile = await imageCompression(file, {
      maxSizeMB: options.targetFileSizeMb ?? DEFAULT_TARGET_FILE_SIZE_MB,
      maxWidthOrHeight: options.maxImageDimension ?? DEFAULT_MAX_IMAGE_DIMENSION,
      useWebWorker: true,
      initialQuality: 0.9,
    });

    if (!isImageFile(optimizedFile)) {
      return {
        ok: false,
        errorCode: "IMAGE_PROCESSING_FAILED",
      };
    }

    if (optimizedFile.size > options.maxFileSizeBytes) {
      return {
        ok: false,
        errorCode: "FILE_TOO_LARGE",
      };
    }

    return {
      ok: true,
      file: optimizedFile,
    };
  } catch {
    return {
      ok: false,
      errorCode: "IMAGE_PROCESSING_FAILED",
    };
  }
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

async function loadImageCompression() {
  const imageCompressionModule = await import("browser-image-compression");

  return imageCompressionModule.default;
}
