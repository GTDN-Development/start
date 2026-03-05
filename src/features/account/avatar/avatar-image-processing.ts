import imageCompression from "browser-image-compression";

const MAX_ACCOUNT_AVATAR_FILE_SIZE_BYTES = 1024 * 1024;
const MAX_ACCOUNT_AVATAR_FILE_SIZE_MB = 1;
const MAX_ACCOUNT_AVATAR_IMAGE_DIMENSION = 1024;

export type PrepareAccountAvatarUploadErrorCode =
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "IMAGE_PROCESSING_FAILED";

export type PrepareAccountAvatarUploadResult =
  | {
      ok: true;
      file: File;
    }
  | {
      ok: false;
      errorCode: PrepareAccountAvatarUploadErrorCode;
    };

export async function prepareAccountAvatarUpload(
  file: File
): Promise<PrepareAccountAvatarUploadResult> {
  if (!isImageFile(file)) {
    return {
      ok: false,
      errorCode: "INVALID_FILE_TYPE",
    };
  }

  if (file.size <= MAX_ACCOUNT_AVATAR_FILE_SIZE_BYTES) {
    return {
      ok: true,
      file,
    };
  }

  try {
    const optimizedFile = await imageCompression(file, {
      maxSizeMB: MAX_ACCOUNT_AVATAR_FILE_SIZE_MB,
      maxWidthOrHeight: MAX_ACCOUNT_AVATAR_IMAGE_DIMENSION,
      useWebWorker: true,
      initialQuality: 0.9,
    });

    if (!isImageFile(optimizedFile)) {
      return {
        ok: false,
        errorCode: "IMAGE_PROCESSING_FAILED",
      };
    }

    if (optimizedFile.size > MAX_ACCOUNT_AVATAR_FILE_SIZE_BYTES) {
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
