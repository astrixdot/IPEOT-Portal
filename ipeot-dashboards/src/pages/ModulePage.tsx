import { useNavigate } from "react-router";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { Button, Card, EmptyState, PageHeader } from "../components/ui/primitives";

export function ModulePage({ eyebrow, title, description, icon, emptyTitle, emptyText }: { eyebrow: string; title: string; description: string; icon: LucideIcon; emptyTitle: string; emptyText: string }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card index={1}>
        <EmptyState
          icon={icon}
          title={emptyTitle}
          action={
            <Button variant="primary" icon={ArrowRight} onClick={() => navigate("/")}>
              Back to MIS dashboard
            </Button>
          }
        >
          {emptyText}
        </EmptyState>
      </Card>
    </div>
  );
}
