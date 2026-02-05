import type enMessages from "../../messages/en.d.json.ts";

type EnNavigationLabels = (typeof enMessages)["layout"]["navigation"]["items"];

export type NavigationLabelKey = Extract<keyof EnNavigationLabels, string>;
export type TranslateNavigationLabel = (key: NavigationLabelKey) => string;
