import { LoaderCircle } from "lucide-react";

export default function Loader({ message = "Loading..." }) {
  return (
    <div className="loader-container" role="status">
      <LoaderCircle size={30} className="spinner" />

      <p>{message}</p>
    </div>
  );
}
