import { useState, useCallback, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/layout/Sidebar'
import { ChatPanel } from './components/chat/ChatPanel'
import { Dashboard } from './modules/Dashboard/Dashboard'
import { Kalender } from './modules/Kalender/Kalender'
import { ZHAWHub } from './modules/ZHAWHub/ZHAWHub'
import { Gym } from './modules/Gym/Gym'
import { Food } from './modules/Food/Food'
import { Health } from './modules/Health/Health'
import { Skincare } from './modules/Skincare/Skincare'
import { StyleBoard } from './modules/StyleBoard/StyleBoard'
import { IntroScreen } from './components/IntroScreen'
import { ChromeBackground } from './components/ChromeBackground'
import { seedGymPlan, seedProfile, seedExerciseLibrary } from './db/db'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kalender" element={<Kalender />} />
        <Route path="/zhaw" element={<ZHAWHub />} />
        <Route path="/gym" element={<Gym />} />
        <Route path="/food" element={<Food />} />
        <Route path="/health" element={<Health />} />
        <Route path="/skin" element={<Skincare />} />
        <Route path="/style" element={<StyleBoard />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('intro_done'))

  const handleIntroDone = useCallback(() => {
    sessionStorage.setItem('intro_done', '1')
    setShowIntro(false)
  }, [])

  useEffect(() => {
    seedGymPlan()
    seedProfile()
    seedExerciseLibrary()
  }, [])

  return (
    <BrowserRouter>
      <AnimatePresence>
        {showIntro && <IntroScreen key="intro" onDone={handleIntroDone} />}
      </AnimatePresence>

      <motion.div
        className="flex h-screen w-screen overflow-hidden bg-bg"
        style={{ position: 'relative' }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: showIntro ? 30 : 0, opacity: showIntro ? 0 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      >
        <ChromeBackground />
        <Sidebar />
        <main className="flex-1 relative overflow-hidden app-content" style={{ zIndex: 1 }}>
          <AnimatedRoutes />
        </main>
        <ChatPanel />
      </motion.div>
    </BrowserRouter>
  )
}
