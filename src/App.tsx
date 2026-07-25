import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import SuspenseLoader from './components/SuspenseLoader'
import { useInit } from './hooks/useInit'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Courses = lazy(() => import('./pages/Courses'))
const CourseDetail = lazy(() => import('./pages/CourseDetail'))
const Playground = lazy(() => import('./pages/Playground'))
const AITutor = lazy(() => import('./pages/AITutor'))
const Progress = lazy(() => import('./pages/Progress'))
const Settings = lazy(() => import('./pages/Settings'))

const ROUTES = [
  { index: true, element: <Dashboard /> },
  { path: 'courses', element: <Courses /> },
  { path: 'courses/:id', element: <CourseDetail /> },
  { path: 'playground', element: <Playground /> },
  { path: 'ai-tutor', element: <AITutor /> },
  { path: 'progress', element: <Progress /> },
  { path: 'settings', element: <Settings /> },
]

export default function App() {
  useInit()

  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<SuspenseLoader />}>
        <Routes>
          <Route element={<Layout />}>
            {ROUTES.map(r => (
              r.index
                ? <Route key="index" index element={r.element} />
                : <Route key={r.path} path={r.path} element={r.element} />
            ))}
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
