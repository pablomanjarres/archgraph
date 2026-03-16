import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProjectList from "./pages/ProjectList";
import ProjectViewer from "./pages/ProjectViewer";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/:projectId" element={<ProjectViewer />} />
      </Routes>
    </BrowserRouter>
  );
}
