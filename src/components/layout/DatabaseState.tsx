import { Card } from "@/components/design-system";

interface DatabaseStateProps {
  loading: boolean;
  error: string | null;
  pathHint: string;
}

export function DatabaseState({ loading, error, pathHint }: DatabaseStateProps) {
  if (loading) {
    return (
      <Card title="Loading data" subtitle={pathHint} style={{ gridColumn: "span 12" }}>
        <p className="section-copy">Waiting for database content...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Database connection required" subtitle={pathHint} style={{ gridColumn: "span 12" }}>
        <p className="section-copy" style={{ marginBottom: 10 }}>
          {error}
        </p>
        <p className="section-copy">Add the document with your page content to remove this state.</p>
      </Card>
    );
  }

  return null;
}
