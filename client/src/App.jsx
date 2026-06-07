import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { getUser } from './lib/session';
import Login from './pages/Login.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherActivity1Board from './pages/teacher/TeacherActivity1Board.jsx';
import TeacherActivity1Padlet from './pages/teacher/TeacherActivity1Padlet.jsx';
import TeacherActivity1SNS from './pages/teacher/TeacherActivity1SNS.jsx';
import TeacherActivity2Board from './pages/teacher/TeacherActivity2Board.jsx';
import TeacherActivity2Revisions from './pages/teacher/TeacherActivity2Revisions.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import Phase1 from './pages/student/Phase1.jsx';
import Activity1SNS from './pages/student/Activity1SNS.jsx';
import Phase2 from './pages/student/Phase2.jsx';
import Activity2Revisions from './pages/student/Activity2Revisions.jsx';
import Phase3 from './pages/student/Phase3.jsx';

function Layout({ children }) {
  const user = getUser();
  return (
    <div className="app-shell">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-sm text-stone-500">6학년 사회 체험 수업</div>
            <h1 className="text-xl font-bold text-stone-900">우리가 만드는 미디어 세상</h1>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

function Protected({ role, children }) {
  const user = getUser();
  if (!user || user.role !== role) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
      <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
      <Route path="/teacher/activity1-board" element={<Protected role="teacher"><TeacherActivity1Board /></Protected>} />
      <Route path="/teacher/activity1-padlet" element={<Protected role="teacher"><TeacherActivity1Padlet /></Protected>} />
      <Route path="/teacher/activity1-sns" element={<Protected role="teacher"><TeacherActivity1SNS /></Protected>} />
      <Route path="/teacher/activity2-board" element={<Protected role="teacher"><TeacherActivity2Board /></Protected>} />
      <Route path="/teacher/activity2-revisions" element={<Protected role="teacher"><TeacherActivity2Revisions /></Protected>} />
      <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
      <Route path="/student/phase1" element={<Protected role="student"><Phase1 /></Protected>} />
      <Route path="/student/activity1-sns" element={<Protected role="student"><Activity1SNS /></Protected>} />
      <Route path="/student/phase2" element={<Protected role="student"><Phase2 /></Protected>} />
      <Route path="/student/activity2-revisions" element={<Protected role="student"><Activity2Revisions /></Protected>} />
      <Route path="/student/phase3" element={<Protected role="student"><Phase3 /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
