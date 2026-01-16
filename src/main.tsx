import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initOverflowDetector } from "./lib/overflowDetector";
import { supportLogger } from "./lib/supportLogger";

// Initialize support logger
supportLogger.init();

// Initialize dev-only overflow detector
initOverflowDetector();

createRoot(document.getElementById("root")!).render(<App />);
