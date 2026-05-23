import { Navigate } from "react-router-dom";

/** Legacy /garasje — canonical er nå /min-garasje. */
export default function GarasjeRedirect() {
  return <Navigate to="/min-garasje" replace />;
}
