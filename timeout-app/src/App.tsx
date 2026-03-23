import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WorkoutDay from './pages/WorkoutDay'
import WorkoutExecution from './pages/WorkoutExecution'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-900 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/day/:day" element={<WorkoutDay />} />
          <Route path="/execute/:day" element={<WorkoutExecution />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}