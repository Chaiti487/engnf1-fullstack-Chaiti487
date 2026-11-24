import { LayoutDashboard } from "lucide-react";

export default function PagePlaceholder({ title, description }) {
  return (
    <>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>

      <div className="panel">
        <div className="empty-state">
          <LayoutDashboard size={40} />

          <h3>{title}</h3>

          <p>This workspace is currently being configured.</p>
        </div>
      </div>
    </>
  );
}
