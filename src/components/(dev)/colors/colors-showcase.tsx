import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

type ColorToken = {
  name: string;
  description: string;
  preview: React.ReactNode;
};

const coreTokens: ColorToken[] = [
  {
    name: "background",
    description: "Primary canvas for pages and large surfaces.",
    preview: <ColorSwatch label="Background" className="bg-background text-foreground" />,
  },
  {
    name: "foreground",
    description: "Default text and icon color on the background.",
    preview: <ColorSwatch label="Foreground" className="bg-foreground text-background" />,
  },
  {
    name: "card",
    description: "Surface for contained content blocks like cards.",
    preview: <ColorSwatch label="Card" className="bg-card text-card-foreground" />,
  },
  {
    name: "card-foreground",
    description: "Text and icon color used on card surfaces.",
    preview: (
      <ColorSwatch label="Card FG" className="bg-card-foreground text-card" />
    ),
  },
  {
    name: "popover",
    description: "Surface for floating panels, dropdowns, and popovers.",
    preview: <ColorSwatch label="Popover" className="bg-popover text-popover-foreground" />,
  },
  {
    name: "popover-foreground",
    description: "Text and icon color on popover surfaces.",
    preview: (
      <ColorSwatch label="Popover FG" className="bg-popover-foreground text-popover" />
    ),
  },
  {
    name: "primary",
    description: "Primary brand color for main actions and emphasis.",
    preview: <ColorSwatch label="Primary" className="bg-primary text-primary-foreground" />,
  },
  {
    name: "primary-foreground",
    description: "Text and icon color on primary surfaces.",
    preview: (
      <ColorSwatch
        label="Primary FG"
        className="bg-primary-foreground text-primary"
      />
    ),
  },
  {
    name: "secondary",
    description: "Secondary surfaces for subtle emphasis.",
    preview: (
      <ColorSwatch label="Secondary" className="bg-secondary text-secondary-foreground" />
    ),
  },
  {
    name: "secondary-foreground",
    description: "Text and icon color on secondary surfaces.",
    preview: (
      <ColorSwatch
        label="Secondary FG"
        className="bg-secondary-foreground text-secondary"
      />
    ),
  },
  {
    name: "muted",
    description: "Low-contrast surfaces for muted regions.",
    preview: <ColorSwatch label="Muted" className="bg-muted text-muted-foreground" />,
  },
  {
    name: "muted-foreground",
    description: "Secondary text color for muted surfaces.",
    preview: (
      <ColorSwatch label="Muted FG" className="bg-muted-foreground text-muted" />
    ),
  },
  {
    name: "accent",
    description: "Accent surfaces for hover and highlights.",
    preview: <ColorSwatch label="Accent" className="bg-accent text-accent-foreground" />,
  },
  {
    name: "accent-foreground",
    description: "Text and icon color on accent surfaces.",
    preview: (
      <ColorSwatch label="Accent FG" className="bg-accent-foreground text-accent" />
    ),
  },
  {
    name: "destructive",
    description: "Destructive actions, errors, and critical emphasis.",
    preview: <ColorSwatch label="Destructive" className="bg-destructive text-white" />,
  },
  {
    name: "border",
    description: "Default border and divider color.",
    preview: (
      <ColorSwatch
        label="Border"
        className="bg-background text-foreground border-4 border-border"
      />
    ),
  },
  {
    name: "input",
    description: "Input background and subtle input accents.",
    preview: (
      <ColorSwatch label="Input" className="bg-input text-foreground border-border" />
    ),
  },
  {
    name: "ring",
    description: "Focus ring color for interactive elements.",
    preview: (
      <ColorSwatch label="Ring" className="bg-background text-foreground ring-2 ring-ring" />
    ),
  },
];

const chartTokens: ColorToken[] = [
  {
    name: "chart-1",
    description: "Data visualization series color 1.",
    preview: <ColorSwatch label="Chart 1" className="bg-chart-1 text-white" />,
  },
  {
    name: "chart-2",
    description: "Data visualization series color 2.",
    preview: <ColorSwatch label="Chart 2" className="bg-chart-2 text-white" />,
  },
  {
    name: "chart-3",
    description: "Data visualization series color 3.",
    preview: <ColorSwatch label="Chart 3" className="bg-chart-3 text-white" />,
  },
  {
    name: "chart-4",
    description: "Data visualization series color 4.",
    preview: <ColorSwatch label="Chart 4" className="bg-chart-4 text-white" />,
  },
  {
    name: "chart-5",
    description: "Data visualization series color 5.",
    preview: <ColorSwatch label="Chart 5" className="bg-chart-5 text-white" />,
  },
];

const sidebarTokens: ColorToken[] = [
  {
    name: "sidebar",
    description: "Sidebar background surface.",
    preview: <ColorSwatch label="Sidebar" className="bg-sidebar text-sidebar-foreground" />,
  },
  {
    name: "sidebar-foreground",
    description: "Default text color inside the sidebar.",
    preview: (
      <ColorSwatch
        label="Sidebar FG"
        className="bg-sidebar-foreground text-sidebar"
      />
    ),
  },
  {
    name: "sidebar-primary",
    description: "Primary action color used in sidebars.",
    preview: (
      <ColorSwatch
        label="Sidebar Primary"
        className="bg-sidebar-primary text-sidebar-primary-foreground"
      />
    ),
  },
  {
    name: "sidebar-primary-foreground",
    description: "Text and icon color on sidebar primary surfaces.",
    preview: (
      <ColorSwatch
        label="Sidebar Primary FG"
        className="bg-sidebar-primary-foreground text-sidebar-primary"
      />
    ),
  },
  {
    name: "sidebar-accent",
    description: "Accent or hover surfaces in sidebars.",
    preview: (
      <ColorSwatch
        label="Sidebar Accent"
        className="bg-sidebar-accent text-sidebar-accent-foreground"
      />
    ),
  },
  {
    name: "sidebar-accent-foreground",
    description: "Text and icon color on sidebar accent surfaces.",
    preview: (
      <ColorSwatch
        label="Sidebar Accent FG"
        className="bg-sidebar-accent-foreground text-sidebar-accent"
      />
    ),
  },
  {
    name: "sidebar-border",
    description: "Divider and border color used in sidebars.",
    preview: (
      <ColorSwatch
        label="Sidebar Border"
        className="bg-sidebar text-sidebar-foreground border-4 border-sidebar-border"
      />
    ),
  },
  {
    name: "sidebar-ring",
    description: "Focus ring color for sidebar interactions.",
    preview: (
      <ColorSwatch
        label="Sidebar Ring"
        className="bg-sidebar text-sidebar-foreground ring-2 ring-sidebar-ring"
      />
    ),
  },
];

export function ColorsShowcase() {
  return (
    <div className="pb-24">
      <Container className="py-16">
        <div>
          <p className="text-muted-foreground text-sm uppercase tracking-wide">Dev Reference</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Theme Colors</h1>
          <p className="text-muted-foreground mt-4 max-w-2xl">
            These tokens come directly from `src/styles/globals.css` and mirror the shadcn/ui
            theming model. Use the descriptions below as a quick reminder for where each color
            belongs.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Core Tokens</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {coreTokens.map((token) => (
              <ColorCard key={token.name} {...token} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Chart Tokens</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chartTokens.map((token) => (
              <ColorCard key={token.name} {...token} />
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Sidebar Tokens</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sidebarTokens.map((token) => (
              <ColorCard key={token.name} {...token} />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

function ColorCard({ name, description, preview }: ColorToken) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-2">
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {preview}
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function ColorSwatch({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-16 items-center justify-center rounded-md border border-border text-xs font-semibold uppercase tracking-wide",
        className
      )}
    >
      {label}
    </div>
  );
}
