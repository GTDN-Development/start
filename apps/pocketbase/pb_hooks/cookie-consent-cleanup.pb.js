cronAdd(
  "cookie-consent-events-retention-cleanup",
  "30 3 * * *",
  function cleanupCookieConsentEvents() {
    var retentionDays = 395;
    var batchSize = 1000;
    var maxBatches = 20;
    var cutoff = formatPocketBaseDate(new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000));
    var deletedRows = 0;

    for (var batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
      var result = $app
        .db()
        .newQuery(
          "DELETE FROM cookie_consent_events " +
            "WHERE id IN (" +
            "SELECT id FROM cookie_consent_events " +
            "WHERE created < {:cutoff} " +
            "ORDER BY created ASC " +
            "LIMIT {:batchSize}" +
            ")"
        )
        .bind({
          cutoff: cutoff,
          batchSize: batchSize,
        })
        .execute();

      var currentDeletedRows = result.rowsAffected();
      deletedRows += currentDeletedRows;

      if (currentDeletedRows < batchSize) {
        break;
      }
    }

    console.log(
      "cookie consent cleanup completed: deletedRows=" + deletedRows + ", cutoff=" + cutoff
    );

    function formatPocketBaseDate(date) {
      return date.toISOString().replace("T", " ");
    }
  }
);
