import { Navigate } from "react-router-dom";

/** Legacy /sporsmal/* — spørsmål er ikke del av MVP. */
export default function SporsmalRedirect() {
  return <Navigate to="/hjem" replace />;
}
