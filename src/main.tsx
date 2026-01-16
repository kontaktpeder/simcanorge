import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOverflowDetector } from "./lib/overflowDetector";

// Initialize dev-only overflow detector
initOverflowDetector();

createRoot(document.getElementById("root")!).render(<App />);
