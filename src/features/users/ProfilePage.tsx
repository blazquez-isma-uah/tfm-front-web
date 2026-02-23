import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getMyProfile, updateMyProfile, updateMyPassword } from '../../api/usersApi'
import type { UserDTO, MyProfileUpdateRequestDTO, PasswordUpdateRequestDTO } from '../../types/users'
import { UserDetailCard } from '../../components/UserDetailCard'
import '../../styles/common.css'

/**
 * ProfilePage — Perfil del usuario autenticado.
 *
 * NOTA: Esta página NO usa los hooks usePagination/useSorting/useRowExpansion
 * porque no tiene tabla paginada ni lista expandible.
 * Sí podría usar useConfirmDialog en el futuro si se añade confirmación
 * para el cambio de contraseña, pero actualmente no es necesario.
 *
 * CAMBIOS respecto al original:
 * - Añadido .page-container y .page-title para consistencia visual
 * - Reemplazado el bloque de successMessage inline por clase .success-message
 *   (definida en common.css, equivalente al .error-message pero en verde)
 * - Eliminados marginBottom inline en form-grid (ya los gestiona el grid gap)
 * - Corregido: textarea usaba "input-full-width" en lugar de "textarea-base"
 */

type ViewMode = 'VIEW' | 'EDIT_PROFILE' | 'CHANGE_PASSWORD'

function ProfilePage() {
    const { token } = useAuth()
    const [user, setUser] = useState<UserDTO | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [mode, setMode] = useState<ViewMode>('VIEW')
    const [saving, setSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Formulario de perfil
    const [formProfile, setFormProfile] = useState<MyProfileUpdateRequestDTO>({
        firstName: '',
        lastName: '',
        secondLastName: '',
        phone: '',
        notes: '',
        profilePictureUrl: '',
        birthDate: '',
    })

    // Formulario de contraseña
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordError, setPasswordError] = useState<string | null>(null)

    // ── Carga inicial del perfil ──────────────────────────────────
    useEffect(() => {
        if (!token) return

        const loadProfile = async () => {
            try {
                setLoading(true)
                setError(null)
                const profile = await getMyProfile(token)
                setUser(profile)
                setFormProfile({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    secondLastName: profile.secondLastName || '',
                    phone: profile.phone || '',
                    notes: profile.notes || '',
                    profilePictureUrl: profile.profilePictureUrl || '',
                    birthDate: profile.birthDate || '',
                })
            } catch (err) {
                console.error('Error loading profile:', err)
                setError('No se pudo cargar tu perfil')
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [token])

    // ── Handlers ─────────────────────────────────────────────────
    const handleEditProfile = () => {
        setMode('EDIT_PROFILE')
        setSuccessMessage(null)
    }

    const handleChangePassword = () => {
        setMode('CHANGE_PASSWORD')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordError(null)
        setSuccessMessage(null)
    }

    const handleCancelEdit = () => {
        setMode('VIEW')
        setPasswordError(null)
        setSuccessMessage(null)
        if (user) {
            setFormProfile({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                secondLastName: user.secondLastName || '',
                phone: user.phone || '',
                notes: user.notes || '',
                profilePictureUrl: user.profilePictureUrl || '',
                birthDate: user.birthDate || '',
            })
        }
    }

    const handleSaveProfile = async (e: FormEvent) => {
        e.preventDefault()
        if (!token) return

        try {
            setSaving(true)
            setError(null)
            const updated = await updateMyProfile(formProfile, token)
            setUser(updated)
            setMode('VIEW')
            setSuccessMessage('Perfil actualizado correctamente')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            console.error('Error updating profile:', err)
            setError(err.response?.data?.message || 'Error al actualizar el perfil')
        } finally {
            setSaving(false)
        }
    }

    const handleSavePassword = async (e: FormEvent) => {
        e.preventDefault()
        if (!token) return

        if (newPassword.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres')
            return
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Las contraseñas no coinciden')
            return
        }

        try {
            setSaving(true)
            setError(null)
            setPasswordError(null)
            const payload: PasswordUpdateRequestDTO = { newPassword }
            await updateMyPassword(payload, token)
            setMode('VIEW')
            setSuccessMessage('Contraseña actualizada correctamente')
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err: any) {
            console.error('Error updating password:', err)
            setPasswordError(err.response?.data?.message || 'Error al actualizar la contraseña')
        } finally {
            setSaving(false)
        }
    }

    // ── Estados de carga / error crítico ─────────────────────────
    if (loading) {
        return (
            <div className="page-container">
                <p>Cargando perfil...</p>
            </div>
        )
    }

    if (error && !user) {
        return (
            <div className="page-container">
                <p className="error-message">{error}</p>
            </div>
        )
    }

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="page-container">
            <h1 className="page-title">Mi Perfil</h1>

            {/* Mensaje de éxito */}
            {successMessage && (
                <div className="success-message">
                    ✓ {successMessage}
                </div>
            )}

            {/* Error no crítico (usuario ya cargado) */}
            {error && (
                <p className="error-message">{error}</p>
            )}

            {/* ── Vista de detalle ── */}
            {mode === 'VIEW' && user && (
                <>
                    <UserDetailCard
                        user={user}
                        showButtons={false}
                    />
                    <div className="button-row-1rem">
                        <button
                            type="button"
                            className="button-primary"
                            onClick={handleEditProfile}
                        >
                            Editar perfil
                        </button>
                        <button
                            type="button"
                            className="button-secondary"
                            onClick={handleChangePassword}
                        >
                            Cambiar contraseña
                        </button>
                    </div>
                </>
            )}

            {/* ── Formulario de edición de perfil ── */}
            {mode === 'EDIT_PROFILE' && (
                <form onSubmit={handleSaveProfile} className="form-card">
                    <h2 className="section-title">Editar perfil</h2>

                    <div className="form-grid">
                        <div className="form-field">
                            <label className="label-text">Nombre</label>
                            <input
                                type="text"
                                value={formProfile.firstName}
                                onChange={(e) => setFormProfile({ ...formProfile, firstName: e.target.value })}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Primer apellido</label>
                            <input
                                type="text"
                                value={formProfile.lastName}
                                onChange={(e) => setFormProfile({ ...formProfile, lastName: e.target.value })}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Segundo apellido</label>
                            <input
                                type="text"
                                value={formProfile.secondLastName}
                                onChange={(e) => setFormProfile({ ...formProfile, secondLastName: e.target.value })}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Teléfono</label>
                            <input
                                type="text"
                                value={formProfile.phone}
                                onChange={(e) => setFormProfile({ ...formProfile, phone: e.target.value })}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field">
                            <label className="label-text">Fecha de nacimiento</label>
                            <input
                                type="date"
                                value={formProfile.birthDate}
                                onChange={(e) => setFormProfile({ ...formProfile, birthDate: e.target.value })}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field grid-full-width">
                            <label className="label-text">URL foto de perfil</label>
                            <input
                                type="url"
                                value={formProfile.profilePictureUrl}
                                onChange={(e) => setFormProfile({ ...formProfile, profilePictureUrl: e.target.value })}
                                className="input-full-width"
                            />
                        </div>
                        <div className="form-field grid-full-width">
                            <label className="label-text">Notas</label>
                            {/* Corregido: era "input-full-width", debe ser "textarea-base" */}
                            <textarea
                                value={formProfile.notes}
                                onChange={(e) => setFormProfile({ ...formProfile, notes: e.target.value })}
                                rows={4}
                                className="textarea-base"
                            />
                        </div>
                    </div>

                    <div className="button-row-1rem">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        <button
                            type="button"
                            className="button-subtle"
                            onClick={handleCancelEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* ── Formulario de cambio de contraseña ── */}
            {mode === 'CHANGE_PASSWORD' && (
                <form onSubmit={handleSavePassword} className="form-card">
                    <h2 className="section-title">Cambiar contraseña</h2>

                    {passwordError && (
                        <p className="error-message">{passwordError}</p>
                    )}

                    <div className="form-grid">
                        <div className="form-field">
                            <label className="label-text">Nueva contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                className="input-full-width"
                            />
                            <small className="field-hint">Mínimo 6 caracteres</small>
                        </div>
                        <div className="form-field">
                            <label className="label-text">Confirmar nueva contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                                className="input-full-width"
                            />
                        </div>
                    </div>

                    <div className="button-row-1rem">
                        <button type="submit" className="button-primary" disabled={saving}>
                            {saving ? 'Guardando...' : 'Cambiar contraseña'}
                        </button>
                        <button
                            type="button"
                            className="button-subtle"
                            onClick={handleCancelEdit}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default ProfilePage