export const SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES = 8 * 1024 * 1024;

export type SupportAttachmentValue = {
  filename: string;
  data: string;
  mimeType: string;
  size: number;
};

export function getSupportAttachmentsTotalSize(attachments: SupportAttachmentValue[]): number {
  return attachments.reduce((total, attachment) => total + attachment.size, 0);
}
