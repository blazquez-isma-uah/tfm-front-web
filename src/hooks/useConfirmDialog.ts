import { useState, useCallback } from 'react'

/**
 * useConfirmDialog — Encapsula el estado y la lógica del modal de confirmación.
 *
 * PROBLEMA QUE RESUELVE:
 * Este bloque aparecía IDÉNTICO en las 4 páginas principales:
 *
 *   const [confirmDialog, setConfirmDialog] = useState({
 *       isOpen: false, title: '', message: '',
 *       variant: 'danger', onConfirm: () => {},
 *   })
 *   const openConfirmDialog = (title, message, variant, onConfirm) => {
 *       setConfirmDialog({ isOpen: true, title, message, variant, onConfirm })
 *   }
 *   const closeConfirmDialog = () => {
 *       setConfirmDialog(prev => ({ ...prev, isOpen: false }))
 *   }
 *
 * Con este hook: 1 línea por página.
 *
 * USO:
 *   const confirm = useConfirmDialog()
 *
 *   // Para abrir el diálogo:
 *   confirm.open({
 *       title: '¿Eliminar usuario?',
 *       message: 'Esta acción no se puede deshacer.',
 *       variant: 'danger',
 *       onConfirm: () => handleDeleteUser(userId),
 *   })
 *
 *   // Para el componente ConfirmDialog:
 *   <ConfirmDialog {...confirm.dialogProps} />
 *
 * NOTA SOBRE useCallback:
 * Las funciones `open` y `close` están memoizadas con useCallback.
 * Esto evita que se re-creen en cada render, lo que podría causar
 * re-renders innecesarios en componentes hijos que las reciban como prop.
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
    /** Abre el diálogo con la configuración indicada */
    open: (options: OpenConfirmOptions) => void
    /** Cierra el diálogo */
    close: () => void
    /** Props listos para pasar a <ConfirmDialog> con spread */
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
    const [state, setState] = useState<ConfirmDialogStateInternal>({
        isOpen: false,
        title: '',
        message: '',
        variant: 'danger',
        onConfirm: () => {},
    })

    const open = useCallback(({ title, message, variant = 'danger', onConfirm }: OpenConfirmOptions) => {
        setState({ isOpen: true, title, message, variant, onConfirm })
    }, [])

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