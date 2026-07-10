import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAthleteProfile, useUpdateAthleteProfile, useGenerateTrainingPlan } from '../../api/hooks'
import type { AthleteProfileRequest } from '../../api/types'
import CardPicker from '../plan-setup/CardPicker'
import SliderPicker, { SliderOption } from '../plan-setup/SliderPicker'
import RangeSlider from '../plan-setup/RangeSlider'
import DayChips from '../plan-setup/DayChips'
import VolumeChart from '../plan-setup/VolumeChart'
import './OnboardingView.css'

const ABILITY_OPTIONS = [
  { value: 'beginner', label: 'Beginner', description: 'You can complete a 5 km run without stopping, in under 60 minutes', icon: '🚶' },
  { value: 'intermediate', label: 'Intermediate', description: "You regularly run at least 5 km but don't structure your training", icon: '🏃' },
  { value: 'advanced', label: 'Advanced', description: 'You regularly run at least 10 km and do some structured training', icon: '🏃' },
  { value: 'elite', label: 'Elite', description: 'You regularly run half-marathons or further and are experienced with structured training', icon: '⚡' },
]

const VOLUME_OPTIONS: SliderOption[] = [
  { value: 'gradual', label: 'Gradual', description: 'Low volume with minimal disruption to daily life, offering gentle progression.', bullets: ['Easy/hard run max ~12 km', 'Long run max ~32 km'] },
  { value: 'steady', label: 'Steady', description: 'Medium volume that balances steady progress with sustainable training.', bullets: ['Easy/hard run max ~13 km', 'Long run max ~33 km'] },
  { value: 'progressive', label: 'Progressive', description: 'High volume for those looking to push their limits and achieve peak performance.', bullets: ['Easy/hard run max ~15 km', 'Long run max ~34 km'] },
]

const DIFFICULTY_OPTIONS: SliderOption[] = [
  { value: 'comfortable', label: 'Comfortable', description: 'A gentler approach, offering runs that prioritize consistency over challenge.', bullets: ['1 hard run every week', 'Minimal difficulty', 'Rarely long runs will have pace targets'] },
  { value: 'balanced', label: 'Balanced', description: 'A well-rounded option with more demanding runs while keeping balance with recovery.', bullets: ['1–2 hard runs per week', 'Reduced difficulty', 'Fewer long runs will have pace targets'] },
  { value: 'challenging', label: 'Challenging', description: 'Runs designed to keep you working hard, improving speed and endurance.', bullets: ['2 hard runs per week', 'Regular difficulty', 'Often long runs will have pace targets'] },
]

// Steps 1..TOTAL_STEPS-2 are the data-collection wizard questions; step 0 is
// the welcome screen and the last step is the closing "you're set" screen —
// neither of those two bookends gets a progress dot or the wizard footer.
const TOTAL_STEPS = 8

interface WizardState {
  running_ability: string
  training_volume: string
  difficulty: string
  weekly_mileage_km: number
  longest_run_km: number
  runs_per_week: number
  available_days: string[]
  long_run_day: string
}

export default function OnboardingView() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useAthleteProfile()
  const { mutate: save, isPending } = useUpdateAthleteProfile()
  const { mutate: generatePlan, isPending: isGenerating } = useGenerateTrainingPlan()

  const [step, setStep] = useState(0)
  const [state, setState] = useState<WizardState>({
    running_ability: profile?.running_ability ?? 'intermediate',
    training_volume: profile?.training_volume ?? 'steady',
    difficulty: profile?.difficulty ?? 'balanced',
    weekly_mileage_km: profile?.weekly_mileage_km ?? 30,
    longest_run_km: profile?.longest_run_km ?? 12,
    runs_per_week: profile?.runs_per_week ?? 4,
    available_days: profile?.available_days ? JSON.parse(profile.available_days) : ['Mon', 'Wed', 'Sat', 'Sun'],
    long_run_day: profile?.long_run_day ?? 'Sun',
  })

  if (isLoading) return <div className="spinner" />

  function patch<K extends keyof WizardState>(key: K, val: WizardState[K]) {
    setState(s => ({ ...s, [key]: val }))
  }

  function next() { setStep(s => Math.min(TOTAL_STEPS - 1, s + 1)) }
  function back() { setStep(s => Math.max(0, s - 1)) }

  // Saves the collected wizard answers, then advances to the closing screen
  // (navigation now happens from that screen's own buttons, not here).
  function finishWizard() {
    const data: AthleteProfileRequest = {
      running_ability: state.running_ability,
      training_volume: state.training_volume,
      difficulty: state.difficulty,
      weekly_mileage_km: state.weekly_mileage_km,
      longest_run_km: state.longest_run_km,
      runs_per_week: state.runs_per_week,
      available_days: JSON.stringify(state.available_days),
      long_run_day: state.long_run_day,
    }
    save(data, { onSuccess: () => setStep(TOTAL_STEPS - 1) })
  }

  const isClosing = step === TOTAL_STEPS - 1
  const isFinalQuestion = step === TOTAL_STEPS - 2

  return (
    <div className="ob-view">
      {step > 0 && !isClosing && (
        <button className="ob-back" onClick={back} aria-label="Back">
          <ChevronLeft size={22} />
        </button>
      )}

      {/* Step dots */}
      {step > 0 && !isClosing && (
        <div className="ob-dots">
          {Array.from({ length: TOTAL_STEPS - 2 }).map((_, i) => (
            <div key={i} className={`ob-dot ${i === step - 1 ? 'ob-dot--active' : i < step - 1 ? 'ob-dot--done' : ''}`} />
          ))}
        </div>
      )}

      <div className="ob-content">
        {step === 0 && <WelcomeStep onStart={next} />}
        {step === 1 && (
          <Step title="How would you rate your running ability?" subtitle="Pick the level that suits you best (you can change this later)">
            <CardPicker value={state.running_ability} onChange={v => patch('running_ability', v)} options={ABILITY_OPTIONS} />
          </Step>
        )}
        {step === 2 && (
          <Step title="What is your preferred training volume?">
            <SliderPicker
              value={state.training_volume}
              onChange={v => patch('training_volume', v)}
              options={VOLUME_OPTIONS}
              chart={<VolumeChart active={state.training_volume as 'gradual' | 'steady' | 'progressive'} />}
            />
          </Step>
        )}
        {step === 3 && (
          <Step title="How hard do you want your plan to be?">
            <SliderPicker value={state.difficulty} onChange={v => patch('difficulty', v)} options={DIFFICULTY_OPTIONS} />
          </Step>
        )}
        {step === 4 && (
          <Step title="How far have you been running recently?" subtitle="Select your average weekly mileage and longest run from the past 4 weeks.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <RangeSlider label="Current Weekly Mileage" value={state.weekly_mileage_km} onChange={v => patch('weekly_mileage_km', v)} min={0} max={200} step={1} unit="km" />
              <RangeSlider label="Current Longest Run" value={state.longest_run_km} onChange={v => patch('longest_run_km', v)} min={0} max={50} step={0.5} unit="km" />
            </div>
          </Step>
        )}
        {step === 5 && (
          <Step title="Set your running schedule" subtitle="Tell us how many days per week you can run, and when you prefer your long run.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div className="ob-field-label">Runs Per Week</div>
                <div className="ob-stepper">
                  <button className="ob-stepper-btn" onClick={() => patch('runs_per_week', Math.max(1, state.runs_per_week - 1))} disabled={state.runs_per_week <= 1}>−</button>
                  <span className="ob-stepper-val">{state.runs_per_week}</span>
                  <button className="ob-stepper-btn" onClick={() => patch('runs_per_week', Math.min(7, state.runs_per_week + 1))} disabled={state.runs_per_week >= 7}>+</button>
                </div>
              </div>
              <div>
                <div className="ob-field-label">Available Days</div>
                <DayChips value={state.available_days} onChange={v => patch('available_days', v)} />
              </div>
              <div>
                <div className="ob-field-label">Long Run Day</div>
                <DayChips value={[state.long_run_day]} onChange={v => patch('long_run_day', v[0] ?? 'Sun')} single />
              </div>
            </div>
          </Step>
        )}
        {step === 6 && (
          <Step title="Choose your race elevation" subtitle="This affects whether hill workouts are included in your plan.">
            <CardPicker
              value={profile?.elevation_profile ?? 'flat'}
              onChange={v => save({ elevation_profile: v })}
              options={[
                { value: 'flat', label: 'Flat', description: 'No hill workouts. Less than 5 m/km elevation gain.', icon: '⟶' },
                { value: 'rolling', label: 'Rolling', description: 'Some hill workouts. 5–10 m/km elevation gain.', icon: '〜' },
                { value: 'moderate', label: 'Moderate', description: 'More hill workouts. 10–20 m/km elevation gain.', icon: '⛰' },
                { value: 'hilly', label: 'Hilly', description: 'Lots of hill workouts. More than 20 m/km elevation gain.', icon: '🏔' },
              ]}
            />
          </Step>
        )}
        {isClosing && (
          <ClosingStep
            onGoToToday={() => navigate('/')}
            onGeneratePlan={() => generatePlan(undefined, { onSuccess: () => navigate('/plan') })}
            generating={isGenerating}
          />
        )}
      </div>

      {step > 0 && !isClosing && (
        <div className="ob-footer">
          {isFinalQuestion ? (
            <button className="ob-btn-primary" onClick={finishWizard} disabled={isPending}>
              {isPending ? 'Saving…' : 'Continue'}
            </button>
          ) : (
            <button className="ob-btn-primary" onClick={next}>Continue</button>
          )}
          {isFinalQuestion && (
            <button className="ob-skip" onClick={() => navigate('/plan')}>Skip</button>
          )}
        </div>
      )}
    </div>
  )
}

function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="ob-welcome">
      <div className="ob-welcome-icon">🏃</div>
      <h1 className="ob-welcome-title">Welcome to Running Coach</h1>
      <p className="ob-welcome-subtitle">
        Let's set up your personalised training plan. It only takes a minute and you can change everything later.
      </p>
      <button className="ob-btn-primary" onClick={onStart}>Get Started</button>
      <button className="ob-skip" onClick={() => window.location.replace('/')}>Skip for now</button>
    </div>
  )
}

function ClosingStep({ onGoToToday, onGeneratePlan, generating }: {
  onGoToToday: () => void
  onGeneratePlan: () => void
  generating: boolean
}) {
  return (
    <div className="ob-welcome">
      <div className="ob-welcome-icon">✅</div>
      <h1 className="ob-welcome-title">You're all set</h1>
      <p className="ob-welcome-subtitle">
        Your first Garmin sync is running in the background. Your training plan
        generates automatically every Sunday — or you can build it right now.
      </p>
      <button className="ob-btn-primary" onClick={onGeneratePlan} disabled={generating}>
        {generating ? 'Generating…' : 'Generate plan now'}
      </button>
      <button className="ob-skip" onClick={onGoToToday}>Go to Today</button>
    </div>
  )
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="ob-step">
      <h2 className="ob-step-title">{title}</h2>
      {subtitle && <p className="ob-step-subtitle">{subtitle}</p>}
      <div className="ob-step-content">{children}</div>
    </div>
  )
}
