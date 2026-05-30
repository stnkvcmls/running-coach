import { useNavigate } from 'react-router-dom'
import { useAthleteProfile, useUpdateAthleteProfile } from '../../api/hooks'
import type { AthleteProfileRequest } from '../../api/types'
import ProfileForm from '../profile/ProfileForm'
import './OnboardingView.css'

export default function OnboardingView() {
  const navigate = useNavigate()
  const { data: profile, isLoading } = useAthleteProfile()
  const updateProfile = useUpdateAthleteProfile()

  if (isLoading) return <div className="spinner" />

  const handleSubmit = (data: AthleteProfileRequest) => {
    updateProfile.mutate(data, { onSuccess: () => navigate('/') })
  }

  return (
    <div className="onboarding-view">
      <header className="onboarding-view__header">
        <h1>Welcome to Running Coach</h1>
        <p>
          Tell us about yourself so your coach can personalize every insight. You can change
          any of this later in Settings.
        </p>
      </header>
      <ProfileForm
        initial={profile}
        onSubmit={handleSubmit}
        isPending={updateProfile.isPending}
        isError={updateProfile.isError}
        submitLabel="Get started"
      />
      <button className="onboarding-view__skip" type="button" onClick={() => navigate('/')}>
        Skip for now
      </button>
    </div>
  )
}
