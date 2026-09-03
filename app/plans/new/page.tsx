import { Container, PageTitle, BackLink } from "@/components/ui/layout";
import { PlanEditor } from "@/components/PlanEditor";
import { StarterPlansSection } from "@/components/StarterPlansSection";

export default function NewPlanPage() {
  return (
    <Container>
      <BackLink href="/">Home</BackLink>
      <PageTitle>New plan</PageTitle>
      <StarterPlansSection />
      <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">
        Or build your own
      </div>
      <PlanEditor />
    </Container>
  );
}
