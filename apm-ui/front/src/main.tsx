import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ToastProvider } from "./context/ToastContext";
import ToastContainer from "./components/UI/Toast";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ToastProvider>
    <App />
    <ToastContainer />
  </ToastProvider>
);
