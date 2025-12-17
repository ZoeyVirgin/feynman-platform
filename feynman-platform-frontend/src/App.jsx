import { Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import KnowledgePointFormPage from './pages/KnowledgePointFormPage';
import FeynmanRecordPage from './pages/FeynmanRecordPage';
import QuizPage from './pages/QuizPage';
import BatchQuizPage from './pages/BatchQuizPage';
import AgentPage from './pages/AgentPage';
import ThreeJSPage from './pages/ThreeJSPage';
import GraphPage from './pages/GraphPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 公共路由 */}
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />

        {/* 受保护的路由 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/kp/new" element={<KnowledgePointFormPage />} />
          <Route path="/kp/edit/:id" element={<KnowledgePointFormPage />} />
          <Route path="/feynman/:id" element={<FeynmanRecordPage />} />
          <Route path="/quiz/:id" element={<QuizPage />} />
          <Route path="/quiz/batch" element={<BatchQuizPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/3d-world" element={<ThreeJSPage />} />
          {/* 将来其他受保护页面可以放在这里 */}
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
