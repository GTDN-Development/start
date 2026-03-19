type ChangelogLocale = "cs" | "en";

type ChangelogEntryCopy = {
  date: string;
  versionLabel: string;
  title: string;
  description: string;
  highlightsTitle: string;
  highlights: string[];
};

type ChangelogEntryRecord = {
  id: string;
  version: string;
  publishedAt: string;
  image: {
    altByLocale: Record<ChangelogLocale, string>;
  } | null;
  copyByLocale: Record<ChangelogLocale, ChangelogEntryCopy>;
};

export type ChangelogEntry = ChangelogEntryCopy & {
  id: string;
  version: string;
  publishedAt: string;
  image: {
    alt: string;
  } | null;
};

const changelogEntries: ChangelogEntryRecord[] = [
  {
    id: "1-10-command-center",
    version: "1.10",
    publishedAt: "2026-04-09",
    image: {
      altByLocale: {
        cs: "Ukázka nového command center panelu",
        en: "Preview of the new command center panel",
      },
    },
    copyByLocale: {
      cs: {
        date: "9. dubna 2026",
        versionLabel: "Verze 1.10",
        title: "Nové command center pro rychlejší práci napříč produktem",
        description:
          "Přidali jsme centralizovaný panel pro rychlé akce, poslední položky a nejdůležitější zkratky, aby se tým dostal k práci během pár kliknutí.",
        highlightsTitle: "Co je nové",
        highlights: [
          "Rychlé akce spojují nejčastější workflow do jednoho místa.",
          "Poslední položky a kontextové zkratky se přizpůsobují tomu, kde tým naposledy pracoval.",
          "Celý panel je navržený tak, aby šel později rozšířit o globální vyhledávání.",
        ],
      },
      en: {
        date: "April 9, 2026",
        versionLabel: "Version 1.10",
        title: "A new command center for faster work across the product",
        description:
          "We added a central panel for quick actions, recent items, and the most important shortcuts so teams can get into work in just a few clicks.",
        highlightsTitle: "What changed",
        highlights: [
          "Quick actions bring the most common workflows into one place.",
          "Recent items and contextual shortcuts adapt to where the team last worked.",
          "The panel is designed to expand later with global search.",
        ],
      },
    },
  },
  {
    id: "1-9-team-activity-stream",
    version: "1.9",
    publishedAt: "2026-03-28",
    image: {
      altByLocale: {
        cs: "Ukázka nového týmového activity streamu",
        en: "Preview of the new team activity stream",
      },
    },
    copyByLocale: {
      cs: {
        date: "28. března 2026",
        versionLabel: "Verze 1.9",
        title: "Týmový activity stream dává důležité změny na jedno místo",
        description:
          "Sjednotili jsme poslední aktivitu týmu do přehlednějšího feedu, aby bylo jasně vidět, co se změnilo a co vyžaduje další pozornost.",
        highlightsTitle: "Co je nové",
        highlights: [
          "Nový feed lépe seskupuje podobné změny a snižuje vizuální šum.",
          "Důležitější události mají výraznější hierarchii a lepší čitelnost.",
          "Připravený základ pro budoucí filtry a personalizované výřezy aktivity.",
        ],
      },
      en: {
        date: "March 28, 2026",
        versionLabel: "Version 1.9",
        title: "A team activity stream that brings important changes into one place",
        description:
          "We consolidated recent team activity into a clearer feed so it is easier to see what changed and what needs attention next.",
        highlightsTitle: "What changed",
        highlights: [
          "The new feed groups similar changes more effectively and reduces visual noise.",
          "More important events now have clearer hierarchy and better readability.",
          "The foundation is ready for future filters and personalized activity views.",
        ],
      },
    },
  },
  {
    id: "1-8-clearer-home-screen",
    version: "1.8",
    publishedAt: "2026-03-19",
    image: {
      altByLocale: {
        cs: "Ukázka nové domácí obrazovky produktu",
        en: "Preview of the updated product home screen",
      },
    },
    copyByLocale: {
      cs: {
        date: "19. března 2026",
        versionLabel: "Verze 1.8",
        title: "Přehlednější domácí obrazovka pro rychlý start",
        description:
          "Upravili jsme úvodní pohled tak, aby se tým dostal k rozpracovaným věcem, posledním aktivitám a nejdůležitějším zkratkám bez zbytečného hledání.",
        highlightsTitle: "Co je nové",
        highlights: [
          "Přepracované rozložení úvodního přehledu s důrazem na rozpracovanou práci.",
          "Rychlé akce jsou dostupné hned v horní části stránky a nezahlcují zbytek rozhraní.",
          "Lepší hierarchie typografie a mezer zrychluje orientaci při prvním načtení.",
        ],
      },
      en: {
        date: "March 19, 2026",
        versionLabel: "Version 1.8",
        title: "A clearer home screen built for fast starts",
        description:
          "We adjusted the opening view so teams can jump into active work, recent activity, and the most important shortcuts without hunting around the interface.",
        highlightsTitle: "What changed",
        highlights: [
          "The overview layout was redesigned to put active work first.",
          "Quick actions now sit at the top of the page without crowding the rest of the interface.",
          "Sharper typography and spacing improve scanability on first load.",
        ],
      },
    },
  },
  {
    id: "1-7-cleaner-workspace-settings",
    version: "1.7",
    publishedAt: "2026-03-06",
    image: {
      altByLocale: {
        cs: "Ukázka nové podoby nastavení workspace",
        en: "Preview of the updated workspace settings layout",
      },
    },
    copyByLocale: {
      cs: {
        date: "6. března 2026",
        versionLabel: "Verze 1.7",
        title: "Detail workspace dostal čistší nastavení",
        description:
          "Sekce nastavení jsme rozřadili do logičtějších bloků, aby správci rychleji našli práci s členy, identitou workspace i základní konfigurací.",
        highlightsTitle: "Co je nové",
        highlights: [
          "Důležité akce jsou oddělené od běžných úprav, takže se v nastavení lépe orientuje.",
          "Správa členů má jasnější prioritizaci rolí a pozvánek.",
          "Vizualní sjednocení položek nastavení navazuje na zbytek aplikace.",
        ],
      },
      en: {
        date: "March 6, 2026",
        versionLabel: "Version 1.7",
        title: "Workspace detail now has cleaner settings",
        description:
          "We regrouped settings into more logical sections so admins can find members, workspace identity, and core configuration faster.",
        highlightsTitle: "What changed",
        highlights: [
          "Critical actions are separated from routine edits, making settings easier to navigate.",
          "Member management now gives clearer emphasis to roles and invitations.",
          "Shared settings items now align visually with the rest of the product.",
        ],
      },
    },
  },
  {
    id: "1-6-better-form-quality",
    version: "1.6",
    publishedAt: "2026-02-20",
    image: {
      altByLocale: {
        cs: "Ukázka vylepšených formulářových stavů",
        en: "Preview of improved form states",
      },
    },
    copyByLocale: {
      cs: {
        date: "20. února 2026",
        versionLabel: "Verze 1.6",
        title: "Lepší kvalita formulářů a menší množství slepých míst",
        description:
          "Zaměřili jsme se na drobná UX zlepšení napříč marketingem i aplikací, aby formuláře dávaly přesnější zpětnou vazbu a celé prostředí působilo konzistentněji.",
        highlightsTitle: "Co je nové",
        highlights: [
          "Stavy odeslání a chybové zprávy jsou čitelnější a lépe navázané na konkrétní pole.",
          "Byly upraveny mezery, ohraničení a kontrast ve sdílených UI prvcích.",
          "Řada menších oprav snížila tření při prvním průchodu produktem.",
        ],
      },
      en: {
        date: "February 20, 2026",
        versionLabel: "Version 1.6",
        title: "Better form quality with fewer dead ends",
        description:
          "We focused on small UX improvements across the marketing site and product so forms give clearer feedback and the interface feels more consistent overall.",
        highlightsTitle: "What changed",
        highlights: [
          "Submission states and errors are easier to read and more tightly connected to each field.",
          "Spacing, borders, and contrast were refined across shared UI primitives.",
          "A set of smaller fixes reduced friction during a first pass through the product.",
        ],
      },
    },
  },
];

export function isChangelogLocale(locale: string): locale is ChangelogLocale {
  return locale === "cs" || locale === "en";
}

export function getChangelogEntries(locale: ChangelogLocale): ChangelogEntry[] {
  return changelogEntries.map((entry) => ({
    id: entry.id,
    version: entry.version,
    publishedAt: entry.publishedAt,
    image: entry.image
      ? {
          alt: entry.image.altByLocale[locale],
        }
      : null,
    ...entry.copyByLocale[locale],
  }));
}
