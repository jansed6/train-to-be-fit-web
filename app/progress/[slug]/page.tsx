"use client";

import { Container, BackLink } from "@/components/ui/layout";
import { ProgressDetail } from "@/components/progress/ProgressDetail";
import { useSessions } from "@/lib/hooks";
import { summaryForSlug } from "@/lib/progress";

export default function ProgressPage({
  params,
}: {
  params: { slug: string };
}) {
  const sessions = useSessions();
  const slug = decodeURIComponent(params.slug);
  const summary = sessions ? summaryForSlug(sessions, slug) : undefined;

  return (
    <Container>
      <BackLink href="/history">History</BackLink>
      {sessions === undefined ? (
        <p className="text-muted">Loading…</p>
      ) : !summary ? (
        <p className="text-muted">No data for this exercise.</p>
      ) : (
        <ProgressDetail summary={summary} />
      )}
    </Container>
  );
}
