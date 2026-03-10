import { useState, useCallback } from 'react'

/**
 * useConfirmDialog — Encapsula el estado y la lógica del modal de confirmación.
 * 
 * Reduce el boilerplate de gestión del modal de confirmación que se repetía
 * idénticamente en todas las páginas principales.
 * 
 * Uso:
 *   const confirm = useConfirmDialog()
 *   confirm.open({ title: '¿Eliminar?', message: '...', variant: 'danger', onConfirm: () => {...} })
 *   <ConfirmDialog {...confirm.dialogProps} />
 */

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info'

type OpenConfirmOptions = {
    title: string
    message: string
    variant?: ConfirmDialogVariant
    onConfirm: () => void
}

type ConfirmDialogStateInternal = {
    isOpen: boolean
    title: string
    message: string
    variant: ConfirmDialogVariant
    onConfirm: () => void
}

export type ConfirmDialogControl = {
    open: (options: OpenConfirmOptions) => void
    close: () => void
    dialogProps: {
        isOpen: boolean
        title: string
        message: string
        variant: ConfirmDialogVariant
        onConfirm: () => void
        onCancel: () => void
    }
}

export function useConfirmDialog(): ConfirmDialogControl {
    // Estado interno del diálogo: título, mensaje, variant y callback de confirmación
    const [state, setState] = useState<ConfirmDialogStateInternal>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        onConfirm: () => {},
    })

    // Abre el diálogo con la configuración proporcionada.
    // useCallback evita que se recree en cada render, optimizando re-renders de hijos
    const open = useCallback(({ title, message, variant = 'danger', onConfirm }: OpenConfirmOptions) => {
        setState({ isOpen: true, title, message, variant, onConfirm })
    }, [])

    // Cierra el diálogo manteniendo el resto del estado intacto
    const close = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }))
    }, [])

    return {
        open,
        close,
        dialogProps: {
            isOpen: state.isOpen,
            title: state.title,
            message: state.message,
            variant: state.variant,
            onConfirm: state.onConfirm,
            onCancel: close,
        },
    }
}