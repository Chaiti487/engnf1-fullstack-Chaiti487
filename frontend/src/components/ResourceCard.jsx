import { DoorOpen, FlaskConical, Cpu, Users, ArrowRight } from "lucide-react";

import { Link } from "react-router-dom";

const resourceIcons = {
  ROOM: DoorOpen,
  LAB: FlaskConical,
  EQUIPMENT: Cpu,
};

export default function ResourceCard({ resource }) {
  const Icon = resourceIcons[resource.type] || Cpu;

  return (
    <article className="resource-card">
      <div className="resource-card-top">
        <div className="resource-icon">
          <Icon size={25} />
        </div>

        <span
          className={
            resource.isActive ? "resource-active" : "resource-inactive"
          }
        >
          {resource.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="resource-card-content">
        <span className="resource-type">{resource.type}</span>

        <h3>{resource.name}</h3>

        <p>
          {resource.description ||
            "Workspace resource available for reservation."}
        </p>
      </div>

      <div className="resource-capacity">
        <Users size={17} />
        Capacity: {resource.capacity}
      </div>

      <Link
        to={`/resources/${resource.id}`}
        className="btn btn-primary full-width"
      >
        View availability
        <ArrowRight size={16} />
      </Link>
    </article>
  );
}
