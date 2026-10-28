export function formatFileSize(megabytes: number): string {
  const bytes = Math.max(0, Math.round(megabytes * 1024 * 1024));

  if (bytes < 1024) return `${bytes} B`;

  const unit = bytes < 1024 * 1024 ? "KB" : "MB";
  const amount = bytes / (unit === "KB" ? 1024 : 1024 * 1024);

  return `${amount.toLocaleString("es-PE", { maximumFractionDigits: 1 })} ${unit}`;
}
