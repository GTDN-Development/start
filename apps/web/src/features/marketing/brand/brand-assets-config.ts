export type BrandColorValueFormat = "oklch" | "hex" | "cmyk";

export type BrandColorValue = {
  format: BrandColorValueFormat;
  value: string;
};

export type BrandColor = {
  id: string;
  preview: string;
  values: ReadonlyArray<BrandColorValue>;
};

export type BrandAssetDownloadFormat = "svg" | "png";

export type BrandAssetDownload = {
  format: BrandAssetDownloadFormat;
  href: string;
  fileName: string;
};

export type BrandAsset = {
  id: string;
  previewSrc: string;
  previewWidth: number;
  previewHeight: number;
  previewShape: "wide" | "portrait" | "square";
  downloads: ReadonlyArray<BrandAssetDownload>;
};

export type BrandAssetsConfig = {
  colors: ReadonlyArray<BrandColor>;
  assets: ReadonlyArray<BrandAsset>;
};

export const brandColorFormatLabels = {
  oklch: "OKLCH",
  hex: "HEX",
  cmyk: "CMYK",
} as const satisfies Record<BrandColorValueFormat, string>;

export const brandAssetFormatLabels = {
  svg: "SVG",
  png: "PNG",
} as const satisfies Record<BrandAssetDownloadFormat, string>;

export const brandAssetsConfig = {
  colors: [
    {
      id: "primary",
      preview: "oklch(0.488 0.243 264.376)",
      values: [
        { format: "oklch", value: "oklch(0.488 0.243 264.376)" },
        { format: "hex", value: "#1447E6" },
        { format: "cmyk", value: "91, 69, 0, 10" },
      ],
    },
    {
      id: "secondary",
      preview: "oklch(0.967 0.001 286.375)",
      values: [
        { format: "oklch", value: "oklch(0.967 0.001 286.375)" },
        { format: "hex", value: "#F4F4F5" },
        { format: "cmyk", value: "0, 0, 0, 4" },
      ],
    },
    {
      id: "accent",
      preview: "oklch(0.967 0.001 286.375)",
      values: [
        { format: "oklch", value: "oklch(0.967 0.001 286.375)" },
        { format: "hex", value: "#F4F4F5" },
        { format: "cmyk", value: "0, 0, 0, 4" },
      ],
    },
    {
      id: "background",
      preview: "oklch(1 0 0)",
      values: [
        { format: "oklch", value: "oklch(1 0 0)" },
        { format: "hex", value: "#FFFFFF" },
        { format: "cmyk", value: "0, 0, 0, 0" },
      ],
    },
    {
      id: "foreground",
      preview: "oklch(0.141 0.005 285.823)",
      values: [
        { format: "oklch", value: "oklch(0.141 0.005 285.823)" },
        { format: "hex", value: "#09090B" },
        { format: "cmyk", value: "20, 20, 0, 96" },
      ],
    },
    {
      id: "muted",
      preview: "oklch(0.967 0.001 286.375)",
      values: [
        { format: "oklch", value: "oklch(0.967 0.001 286.375)" },
        { format: "hex", value: "#F4F4F5" },
        { format: "cmyk", value: "0, 0, 0, 4" },
      ],
    },
    {
      id: "destructive",
      preview: "oklch(0.577 0.245 27.325)",
      values: [
        { format: "oklch", value: "oklch(0.577 0.245 27.325)" },
        { format: "hex", value: "#E7000B" },
        { format: "cmyk", value: "0, 100, 95, 9" },
      ],
    },
  ],
  assets: [
    {
      id: "startLogo",
      previewSrc: "/brand-assets/start-logo.svg",
      previewWidth: 425,
      previewHeight: 124,
      previewShape: "wide",
      downloads: [
        {
          format: "svg",
          href: "/brand-assets/start-logo.svg",
          fileName: "start-logo.svg",
        },
        {
          format: "png",
          href: "/brand-assets/start-logo.png",
          fileName: "start-logo.png",
        },
      ],
    },
    {
      id: "startSymbol",
      previewSrc: "/brand-assets/start-symbol.svg",
      previewWidth: 93,
      previewHeight: 124,
      previewShape: "portrait",
      downloads: [
        {
          format: "svg",
          href: "/brand-assets/start-symbol.svg",
          fileName: "start-symbol.svg",
        },
        {
          format: "png",
          href: "/brand-assets/start-symbol.png",
          fileName: "start-symbol.png",
        },
      ],
    },
    {
      id: "startAppIcon",
      previewSrc: "/brand-assets/start-app-icon.svg",
      previewWidth: 179,
      previewHeight: 179,
      previewShape: "square",
      downloads: [
        {
          format: "svg",
          href: "/brand-assets/start-app-icon.svg",
          fileName: "start-app-icon.svg",
        },
        {
          format: "png",
          href: "/brand-assets/start-app-icon.png",
          fileName: "start-app-icon.png",
        },
      ],
    },
  ],
} as const satisfies BrandAssetsConfig;
