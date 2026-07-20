import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { fetchAnalysisResult } from "@/features/laboratory/analysis-results-api";

import { QcInboxSection } from "./qc-inbox-section";
import { QcJobsBoard, QcRecentDecisionsStrip } from "./qc-jobs-board";
import { QcReviewPanel } from "./qc-review-panel";
import type { AnalysisResult } from "@/types/laboratory";

export default function QcReviewDeskPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const resultParam = searchParams.get("result");
  const [selected, setSelected] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    if (!resultParam) {
      setSelected(null);
      return;
    }
    let cancelled = false;
    void fetchAnalysisResult(resultParam)
      .then((r) => {
        if (!cancelled && r.state === "submitted") setSelected(r);
      })
      .catch(() => {
        if (!cancelled) setSelected(null);
      });
    return () => {
      cancelled = true;
    };
  }, [resultParam]);

  const openResult = useCallback(
    (result: AnalysisResult) => {
      setSelected(result);
      setSearchParams({ result: result.id }, { replace: true });
    },
    [setSearchParams],
  );

  const closeResult = useCallback(() => {
    setSelected(null);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return (
    <div className="space-y-8">
      <QcInboxSection
        selectedId={selected?.id ?? null}
        onSelect={openResult}
      />

      {selected ? (
        <QcReviewPanel
          result={selected}
          onClose={closeResult}
          onDecided={closeResult}
        />
      ) : null}

      <QcRecentDecisionsStrip />
      <QcJobsBoard />
    </div>
  );
}
