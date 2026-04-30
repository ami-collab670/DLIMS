"""Job ↔ sample workflow helpers."""

from __future__ import annotations


def sync_sample_statuses_from_job(job) -> int:
    """
    Copy ``job.current_status`` onto all samples that opt into automatic workflow.

    Returns the number of rows updated.
    """
    target = job.current_status
    return (
        job.samples.filter(status_sync_with_job=True)
        .exclude(sample_status=target)
        .update(sample_status=target)
    )
