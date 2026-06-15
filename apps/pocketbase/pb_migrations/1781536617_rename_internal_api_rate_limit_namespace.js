/// <reference path="../pb_data/types.d.ts" />

const LEGACY_RATE_LIMIT_LABEL = ["POST /api", "start/organization-invites/inspect"].join("/");
const WEB_RATE_LIMIT_LABEL = "POST /api/web/organization-invites/inspect";

migrate(
  (app) => {
    replaceRateLimitLabel(app, LEGACY_RATE_LIMIT_LABEL, WEB_RATE_LIMIT_LABEL);
  },
  (app) => {
    replaceRateLimitLabel(app, WEB_RATE_LIMIT_LABEL, LEGACY_RATE_LIMIT_LABEL);
  }
);

function replaceRateLimitLabel(app, fromLabel, toLabel) {
  const settings = app.settings();
  const rateLimits = settings.rateLimits;

  if (!rateLimits || !Array.isArray(rateLimits.rules)) {
    return;
  }

  const toLabelExists = rateLimits.rules.some((rule) => rule && rule.label === toLabel);
  let changed = false;

  rateLimits.rules = rateLimits.rules
    .map((rule) => {
      if (!rule || rule.label !== fromLabel) {
        return rule;
      }

      changed = true;

      if (toLabelExists) {
        return null;
      }

      return {
        ...rule,
        label: toLabel,
      };
    })
    .filter(Boolean);

  if (changed) {
    app.save(settings);
  }
}
