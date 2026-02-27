import { useEffect, useState, type FormEvent } from 'react'
import type { SurveyDTO, SurveyResponseDTO, YesNoMaybeAnswer } from '../types/surveys'
import type { InstrumentDTO } from '../types/instruments'
import { 
    respondToSurvey, 
    getMyResponse, 
    updateMyResponse, 
    deleteMyResponse 
} from '../api/surveysApi'
import { getMyProfile } from '../api/usersApi'
import { useAuth } from '../features/auth/AuthContext'
import { extractErrorMessage } from '../utils/errorHandler'
import { translateYesNoMaybeAnswer } from '../utils/surveyTranslations'
import { ConfirmDialog } from './ConfirmDialog'
import { XMarkIcon } from './Icons'
import '../styles/common.css'

interface SurveyResponseFormProps {
    survey: SurveyDTO
    onResponseSubmitted?: () => void
    onHide?: () => void
}

export function SurveyResponseForm({ survey, onResponseSubmitted, onHide }: SurveyResponseFormProps) {
    const { token } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Estado de la respuesta actual
    const [existingResponse, setExistingResponse] = useState<SurveyResponseDTO | null>(null)
    const [hasResponse, setHasResponse] = useState(false)

    // Instrumentos del usuario
    const [userInstruments, setUserInstruments] = useState<InstrumentDTO[]>([])
    const [loadingInstruments, setLoadingInstruments] = useState(false)

    // Formulario
    const [selectedAnswer, setSelectedAnswer] = useState<YesNoMaybeAnswer>('')
    const [selectedInstrumentId, setSelectedInstrumentId] = useState<string>('')
    const [comment, setComment] = useState('')

    // Diálogo de confirmación para eliminar
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        onConfirm: () => {},
    })

    const needsInstrument = survey.responseType === 'YES_NO_MAYBE_WITH_INSTRUMENT'

    // Cargar respuesta existente y perfil del usuario
    useEffect(() => {
        if (!token) return

        const loadData = async () => {
            try {
                setLoading(true)
                setError(null)

                // Cargar respuesta existente
                try {
                    const response = await getMyResponse(survey.id, token)
                    setExistingResponse(response)
                    setHasResponse(true)
                    setSelectedAnswer(response.answerYesNoMaybe)
                    setSelectedInstrumentId(response.instrumentId || '')
                    setComment(response.comment || '')
                } catch (err: any) {
                    // 404 significa que no hay respuesta aún
                    if (err?.response?.status === 404) {
                        setHasResponse(false)
                        setExistingResponse(null)
                    } else {
                        throw err
                    }
                }

                // Si la encuesta requiere instrumento, cargar instrumentos del usuario
                if (needsInstrument) {
                    setLoadingInstruments(true)
                    const profile = await getMyProfile(token)
                    setUserInstruments(profile.instruments || [])
                    setLoadingInstruments(false)
                }
            } catch (err) {
                console.error('Error loading survey response data:', err)
                setError(extractErrorMessage(err, 'Error cargando datos'))
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [survey.id, token, needsInstrument])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (!token) return

        // Validaciones
        if (!selectedAnswer) {
            setError('Debes seleccionar una respuesta')
            return
        }

        if (needsInstrument && !selectedInstrumentId) {
            setError('Debes seleccionar un instrumento')
            return
        }

        try {
            setSaving(true)
            setError(null)
            setSuccessMessage(null)

            const payload = {
                answer: selectedAnswer,
                instrumentId: needsInstrument ? selectedInstrumentId : undefined,
                comment: comment.trim() || undefined,
            }

            if (hasResponse && existingResponse) {
                // Actualizar respuesta existente
                const updated = await updateMyResponse(
                    survey.id,
                    payload,
                    existingResponse.version,
                    token
                )
                setExistingResponse(updated)
                setSuccessMessage('Respuesta actualizada correctamente')
            } else {
                // Crear nueva respuesta
                const created = await respondToSurvey(
                    survey.id,
                    payload,
                    existingResponse?.version || 0,
                    token
                )
                setExistingResponse(created)
                setHasResponse(true)
                setSuccessMessage('Respuesta enviada correctamente')
            }

            setTimeout(() => setSuccessMessage(null), 3000)
            onResponseSubmitted?.()
        } catch (err: any) {
            console.error('Error submitting response:', err)
            const status = err?.response?.status
            if (status === 412 || status === 428) {
                setError('La encuesta o tu respuesta ha sido modificada. Recarga la página.')
            } else {
                setError(extractErrorMessage(err, 'Error al guardar la respuesta'))
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = () => {
        if (!token || !existingResponse) return

        setConfirmDialog({
            isOpen: true,
            onConfirm: async () => {
                setConfirmDialog({ isOpen: false, onConfirm: () => {} })
                try {
                    setSaving(true)
                    setError(null)
                    await deleteMyResponse(survey.id, existingResponse.version, token)
                    
                    // Resetear estado
                    setExistingResponse(null)
                    setHasResponse(false)
                    setSelectedAnswer('')
                    setSelectedInstrumentId('')
                    setComment('')
                    setSuccessMessage('Respuesta eliminada correctamente')
                    setTimeout(() => setSuccessMessage(null), 3000)
                    onResponseSubmitted?.()
                } catch (err: any) {
                    console.error('Error deleting response:', err)
                    const status = err?.response?.status
                    if (status === 412 || status === 428) {
                        setError('La respuesta ha sido modificada. Recarga la página.')
                    } else {
                        setError(extractErrorMessage(err, 'Error al eliminar la respuesta'))
                    }
                } finally {
                    setSaving(false)
                }
            },
        })
    }

    if (loading) {
        return (
            <div className="card" style={{ padding: '1rem' }}>
                <p>Cargando...</p>
            </div>
        )
    }

    // Verificar si la encuesta está abierta
    const now = new Date()
    const opensAt = new Date(survey.opensAt)
    const closesAt = new Date(survey.closesAt)
    const isOpen = now >= opensAt && now <= closesAt && survey.status === 'OPEN'

    if (!isOpen) {
        return (
            <div className="card" style={{ padding: '1rem', backgroundColor: '#f5f5f5' }}>
                <p style={{ margin: 0, color: '#666' }}>
                    {survey.status === 'CLOSED' ? 
                        'Esta encuesta está cerrada' : 
                        survey.status === 'CANCELLED' ?
                        'Esta encuesta ha sido cancelada' :
                        now < opensAt ?
                        'Esta encuesta aún no ha abierto' :
                        'Esta encuesta ya no acepta respuestas'
                    }
                </p>
                {hasResponse && existingResponse && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '4px' }}>
                        <strong>Tu respuesta:</strong> {translateYesNoMaybeAnswer(existingResponse.answerYesNoMaybe)}
                        {existingResponse.instrumentId && needsInstrument && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <strong>Instrumento:</strong> {
                                    userInstruments.find(i => i.id.toString() === existingResponse.instrumentId)?.instrumentName || 
                                    existingResponse.instrumentId
                                }
                            </div>
                        )}
                        {existingResponse.comment && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <strong>Comentario:</strong> {existingResponse.comment}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                    {hasResponse ? 'Actualizar respuesta' : 'Responder encuesta'}
                </h3>
                {onHide && (
                    <button type="button" className="button-secondary" onClick={onHide}>
                        <XMarkIcon /> Ocultar
                    </button>
                )}
            </div>

            {error && <p className="error-message">{error}</p>}
            {successMessage && (
                <p style={{ 
                    padding: '0.75rem', 
                    backgroundColor: '#e8f5e9', 
                    color: '#2e7d32', 
                    borderRadius: '4px',
                    marginBottom: '1rem' 
                }}>
                    {successMessage}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                {/* Selector de respuesta */}
                <div className="form-field" style={{ marginBottom: '1rem' }}>
                    <label className="label-text">Tu respuesta *</label>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                        <button
                            type="button"
                            onClick={() => setSelectedAnswer('YES')}
                            className={selectedAnswer === 'YES' ? 'button-primary' : 'button-secondary'}
                            style={{ minWidth: '100px' }}
                        >
                            ✓ Sí
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedAnswer('NO')}
                            className={selectedAnswer === 'NO' ? 'button-danger' : 'button-secondary'}
                            style={{ minWidth: '100px' }}
                        >
                            ✗ No
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedAnswer('MAYBE')}
                            className={selectedAnswer === 'MAYBE' ? 'button-primary' : 'button-secondary'}
                            style={{ minWidth: '100px', backgroundColor: selectedAnswer === 'MAYBE' ? '#ff9800' : undefined }}
                        >
                            ? Quizás
                        </button>
                    </div>
                </div>

                {/* Selector de instrumento */}
                {needsInstrument && (
                    <div className="form-field" style={{ marginBottom: '1rem' }}>
                        <label className="label-text">Instrumento *</label>
                        {loadingInstruments ? (
                            <p>Cargando instrumentos...</p>
                        ) : userInstruments.length === 0 ? (
                            <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                No tienes instrumentos asignados. Contacta con un administrador.
                            </p>
                        ) : (
                            <select
                                value={selectedInstrumentId}
                                onChange={(e) => setSelectedInstrumentId(e.target.value)}
                                required
                                className="select-base"
                                style={{ marginTop: '0.5rem' }}
                            >
                                <option value="">Selecciona un instrumento</option>
                                {userInstruments.map((instrument) => (
                                    <option key={instrument.id} value={instrument.id.toString()}>
                                        {instrument.instrumentName} {instrument.voice && `- ${instrument.voice}`}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                )}

                {/* Campo de comentario */}
                <div className="form-field" style={{ marginBottom: '1rem' }}>
                    <label className="label-text">Comentario (opcional)</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="textarea-base"
                        rows={3}
                        maxLength={500}
                        placeholder="Añade un comentario si lo deseas..."
                        style={{ marginTop: '0.5rem' }}
                    />
                    <small style={{ color: '#666', fontSize: '0.85rem' }}>
                        {comment.length}/500 caracteres
                    </small>
                </div>

                {/* Botones de acción */}
                <div className="button-row-1rem">
                    <button 
                        type="submit" 
                        className="button-primary" 
                        disabled={saving || (needsInstrument && userInstruments.length === 0)}
                    >
                        {saving ? 'Guardando...' : hasResponse ? 'Actualizar' : 'Enviar'}
                    </button>
                    {hasResponse && (
                        <button
                            type="button"
                            className="button-danger"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            Eliminar respuesta
                        </button>
                    )}
                </div>
            </form>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title="Eliminar respuesta"
                message="¿Estás seguro de que quieres eliminar tu respuesta? Esta acción no se puede deshacer."
                variant="danger"
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ isOpen: false, onConfirm: () => {} })}
            />
        </div>
    )
}
