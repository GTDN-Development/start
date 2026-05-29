export type BrandColorValue = {
  format: string;
  value: string;
};

export type BrandColor = {
  id: string;
  preview: string;
  values: readonly BrandColorValue[];
};

export type BrandAssetDownload = {
  format: string;
  href: string;
  fileName: string;
};

export type BrandAsset = {
  id: string;
  previewSrc: string;
  previewWidth: number;
  previewHeight: number;
  previewClassName: string;
  downloads: readonly BrandAssetDownload[];
};

export type BrandAssetsConfig = {
  colors: readonly BrandColor[];
  assets: readonly BrandAsset[];
};

export const brandAssetsConfig = {
  colors: [
    {
      id: "primary",
      preview: "oklch(0.488 0.243 264.376)",
      values: [
        { format: "OKLCH", value: "oklch(0.488 0.243 264.376)" },
        { format: "HEX", value: "#1447E6" },
        { format: "CMYK", value: "91, 69, 0, 10" },
      ],
    },
    {
      id: "secondary",
      preview: "oklch(0.967 0.001 286.375)",
      values: [
        { format: "OKLCH", value: "oklch(0.967 0.001 286.375)" },
        { format: "HEX", value: "#F4F4F5" },
        { format: "CMYK", value: "0, 0, 0, 4" },
      ],
    },
    {
      id: "accent",
      preview: "oklch(0.967 0.001 286.375)",
      values: [
        { format: "OKLCH", value: "oklch(0.967 0.001 286.375)" },
        { format: "HEX", value: "#F4F4F5" },
        { format: "CMYK", value: "0, 0, 0, 4" },
      ],
    },
    {
      id: "background",
      preview: "oklch(1 0 0)",
      values: [
        { format: "OKLCH", value: "oklch(1 0 0)" },
        { format: "HEX", value: "#FFFFFF" },
        { format: "CMYK", value: "0, 0, 0, 0" },
      ],
    },
    {
      id: "foreground",
      preview: "oklch(0.141 0.005 285.823)",
      values: [
        { format: "OKLCH", value: "oklch(0.141 0.005 285.823)" },
        { format: "HEX", value: "#09090B" },
        { format: "CMYK", value: "20, 20, 0, 96" },
      ],
    },
    {
      id: "muted",
      preview: "oklch(0.967 0.001 286.375)",
      values: [
        { format: "OKLCH", value: "oklch(0.967 0.001 286.375)" },
        { format: "HEX", value: "#F4F4F5" },
        { format: "CMYK", value: "0, 0, 0, 4" },
      ],
    },
    {
      id: "destructive",
      preview: "oklch(0.577 0.245 27.325)",
      values: [
        { format: "OKLCH", value: "oklch(0.577 0.245 27.325)" },
        { format: "HEX", value: "#E7000B" },
        { format: "CMYK", value: "0, 100, 95, 9" },
      ],
    },
  ],
  assets: [
    {
      id: "startLogo",
      previewSrc: "/brand-assets/start-logo.svg",
      previewWidth: 425,
      previewHeight: 124,
      previewClassName: "h-auto max-h-24 w-full",
      downloads: [
        {
          format: "SVG",
          href: "/brand-assets/start-logo.svg",
          fileName: "start-logo.svg",
        },
        {
          format: "PNG",
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
      previewClassName: "h-full max-h-40 w-auto",
      downloads: [
        {
          format: "SVG",
          href: "/brand-assets/start-symbol.svg",
          fileName: "start-symbol.svg",
        },
        {
          format: "PNG",
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
      previewClassName: "size-28",
      downloads: [
        {
          format: "SVG",
          href: "/brand-assets/start-app-icon.svg",
          fileName: "start-app-icon.svg",
        },
        {
          format: "PNG",
          href: "/brand-assets/start-app-icon.png",
          fileName: "start-app-icon.png",
        },
      ],
    },
  ],
} as const satisfies BrandAssetsConfig;
