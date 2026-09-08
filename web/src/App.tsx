import { Navigate, Route, Routes } from "react-router-dom";
import { Topbar, useScope } from "./components/Topbar";
import { AboutPage } from "./pages/AboutPage";
import { AgentDetailPage } from "./pages/AgentDetailPage";
import { AgentsPage } from "./pages/AgentsPage";
import { HomePage } from "./pages/HomePage";
import { LifecyclePage } from "./pages/LifecyclePage";
import { PipelineDetailPage } from "./pages/PipelineDetailPage";
import { PipelinesPage } from "./pages/PipelinesPage";

export default function App() {
  const { scope, update } = useScope();
  return (
    <div className="shell">
      <Topbar scope={scope} onChange={update} />
      <Routes>
        <Route path="/" element={<HomePage scope={scope} />} />
        <Route path="/lifecycle" element={<LifecyclePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentDetailPage scope={scope} />} />
        <Route path="/pipelines" element={<PipelinesPage scope={scope} />} />
        <Route path="/pipelines/:id" element={<PipelineDetailPage scope={scope} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
