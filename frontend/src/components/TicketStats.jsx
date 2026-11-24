import { Inbox, Clock3, ClipboardCheck, BrainCircuit } from "lucide-react";

export default function TicketStats({ stats }) {
  const total = Object.values(stats?.byStatus || {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  const cards = [
    {
      label: "Total tickets",
      value: total,
      icon: Inbox,
      color: "teal",
      description: "All incoming requests",
    },
    {
      label: "Open tickets",
      value: stats?.byStatus?.OPEN || 0,
      icon: Clock3,
      color: "blue",
      description: "Awaiting resolution",
    },
    {
      label: "Reviewed tickets",
      value: stats?.reviewedCount || 0,
      icon: ClipboardCheck,
      color: "purple",
      description: "Verified by agents",
    },
    {
      label: "Model agreement",
      value: `${stats?.modelAgreementRate || 0}%`,
      icon: BrainCircuit,
      color: "amber",
      description: "Reviewed classification accuracy",
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map(({ label, value, icon: Icon, color, description }) => (
        <article className="stat-card" key={label}>
          <div className="stat-card-top">
            <span>{label}</span>

            <div className={`stat-icon ${color}`}>
              <Icon size={21} />
            </div>
          </div>

          <h2>{value}</h2>

          <p>{description}</p>
        </article>
      ))}
    </div>
  );
}
