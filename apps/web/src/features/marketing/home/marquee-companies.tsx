import StartLogoSvg from "@/assets/svgs/start-logo.svg";
import StartSymbolSvg from "@/assets/svgs/start-symbol.svg";
import { app } from "@/config/app";
import { cn } from "@/lib/utils";

export type MarqueeItem = {
  name: string;
  logo: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  href: string;
};

const siteUrl = `${app.site.url.replace(/\/+$/g, "")}/`;

const marqueePartnersDefault: MarqueeItem[] = [
  { name: "Start Logo", logo: StartLogoSvg, href: siteUrl },
  { name: "Start Symbol", logo: StartSymbolSvg, href: siteUrl },
  { name: "Start Logo", logo: StartLogoSvg, href: siteUrl },
  { name: "Start Symbol", logo: StartSymbolSvg, href: siteUrl },
  { name: "Start Logo", logo: StartLogoSvg, href: siteUrl },
  { name: "Start Symbol", logo: StartSymbolSvg, href: siteUrl },
  { name: "Start Logo", logo: StartLogoSvg, href: siteUrl },
  { name: "Start Symbol", logo: StartSymbolSvg, href: siteUrl },
  { name: "Start Logo", logo: StartLogoSvg, href: siteUrl },
  { name: "Start Symbol", logo: StartSymbolSvg, href: siteUrl },
  { name: "Start Logo", logo: StartLogoSvg, href: siteUrl },
  { name: "Start Symbol", logo: StartSymbolSvg, href: siteUrl },
];

export function MarqueeCompanies({
  items = marqueePartnersDefault,
  reverse = false,
}: {
  items?: MarqueeItem[];
  reverse?: boolean;
}) {
  const hasFewBrands = items.length < 10;

  return (
    <div>
      <div className="group relative flex gap-8 overflow-hidden mask-x-from-90% mask-x-to-100% select-none">
        <Marquee items={items} reverse={reverse} />
        <Marquee items={items} reverse={reverse} />
        {hasFewBrands && <Marquee items={items} reverse={reverse} />}
      </div>
    </div>
  );
}

function Marquee({ items, reverse = false }: { items: MarqueeItem[]; reverse?: boolean }) {
  return (
    <div
      className={cn(
        "flex shrink-0 justify-around gap-12",
        reverse
          ? "animate-[marquee-reverse_50s_linear_infinite]"
          : "animate-[marquee_50s_linear_infinite]"
      )}
    >
      {items.map((item, index) => {
        const LogoComponent = item.logo;

        return (
          <a
            key={index}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center p-4"
          >
            <span className="sr-only">{item.name}</span>
            <LogoComponent aria-hidden="true" className="h-8 max-w-full fill-current" />
          </a>
        );
      })}
    </div>
  );
}
