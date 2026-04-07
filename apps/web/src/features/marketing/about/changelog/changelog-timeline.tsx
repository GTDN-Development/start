import { Container } from "@/components/ui/container";
import {
  Timeline,
  TimelineAside,
  TimelineContent,
  TimelineItem,
  TimelineStickyAside,
} from "@/components/ui/timeline";
import type { ChangelogEntry } from "./changelog-content";

type ChangelogTimelineProps = {
  entries: ChangelogEntry[];
};

export function ChangelogTimeline({ entries }: ChangelogTimelineProps) {
  return (
    <Container render={<section />} size="xl" className="pb-24 sm:pb-28">
      <div className="mx-auto max-w-5xl">
        <Timeline>
          {entries.map((entry) => (
            <TimelineItem key={entry.id}>
              <TimelineAside>
                <TimelineStickyAside>
                  <p className="text-muted-foreground/80 text-sm leading-6">{entry.date}</p>
                  <p className="text-foreground/70 mt-2 text-xs font-medium tracking-widest uppercase">
                    {entry.versionLabel}
                  </p>
                </TimelineStickyAside>
              </TimelineAside>

              <TimelineContent>
                <h2 className="text-foreground font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                  {entry.title}
                </h2>
                <p className="text-muted-foreground mt-5 max-w-prose text-base leading-7 text-pretty sm:text-lg">
                  {entry.description}
                </p>

                <div className="mt-8 aspect-16/10 w-full rounded-3xl bg-black" />

                <div className="mt-8 max-w-prose">
                  <p className="text-foreground/80 text-xs font-medium tracking-widest uppercase">
                    {entry.highlightsTitle}
                  </p>
                  <ul className="mt-4 space-y-3">
                    {entry.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="text-muted-foreground flex items-start gap-3 text-base leading-7"
                      >
                        <span
                          aria-hidden="true"
                          className="bg-foreground/80 mt-3 block size-1 shrink-0 rounded-full"
                        />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
    </Container>
  );
}

// poznámka k dalšímu vývoji: chybí pagination
//
