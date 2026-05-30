import { useAthleteProfile, useUpdateAthleteProfile } from '../../api/hooks'
import type { AthleteProfileRequest } from '../../api/types'
import ProfileForm from '../profile/ProfileForm'

export default function AthleteProfileSection() {
  const { data: profile, isLoading } = useAthleteProfile()
  const updateProfile = useUpdateAthleteProfile()

  if (isLoading) return null

  const handleSubmit = (data: AthleteProfileRequest) => {
    updateProfile.mutate(data)
  }

  return (
    <section className="settings-section">
      <h2 className="section-title">Athlete Profile</h2>
      <div className="card">
        <ProfileForm
          initial={profile}
          onSubmit={handleSubmit}
          isPending={updateProfile.isPending}
          isError={updateProfile.isError}
          submitLabel="Save profile"
        />
        {updateProfile.isSuccess && !updateProfile.isPending && (
          <span className="profile-form__error" style={{ color: 'var(--success)' }}>
            Profile saved
          </span>
        )}
      </div>
    </section>
  )
}
