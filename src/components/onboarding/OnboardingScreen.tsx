import { Player } from '@remotion/player'
import { motion } from 'framer-motion'
import { OnboardingComposition } from '../../remotion/Onboarding'

interface OnboardingScreenProps {
  onDone: () => void
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-bg flex flex-col items-center justify-center gap-8"
    >
      <div className="rounded-2xl overflow-hidden border border-border shadow-2xl" style={{ width: 300, height: 650 }}>
        <Player
          component={OnboardingComposition}
          durationInFrames={270}
          fps={30}
          compositionWidth={390}
          compositionHeight={844}
          style={{ width: '100%', height: '100%' }}
          autoPlay
          loop={false}
          controls={false}
          acknowledgeRemotionLicense
        />
      </div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        onClick={onDone}
        className="chrome-text text-sm underline underline-offset-4 hover:opacity-70 transition-opacity"
      >
        Skip intro →
      </motion.button>
    </motion.div>
  )
}
