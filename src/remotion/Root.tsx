import { Composition } from 'remotion'
import { OnboardingComposition } from './Onboarding'
import { GymSummaryComposition } from './GymSummary'
import { DashboardIntro } from './DashboardIntro'

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Onboarding"
        component={OnboardingComposition}
        durationInFrames={270}
        fps={30}
        width={390}
        height={844}
      />
      <Composition
        id="GymSummary"
        component={GymSummaryComposition}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="DashboardIntro"
        component={DashboardIntro}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  )
}
