/**
 * Redimensiona y comprime una imagen en el navegador antes de subirla.
 * Evita subir fotos de excesivamente grandes (10-30MB) cuando se van a mostrar
 * como avatar de 100-200px. Reduce el tamaño típico a 100-400KB sin pérdida
 * perceptible a ese tamaño de visualización.
 */
export async function compressImageToJpeg(
    file: File,
    maxDimension = 800,
    quality = 0.8,
): Promise<Blob> {
    const imageBitmap = await createImageBitmap(file)

    let { width, height } = imageBitmap
    if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo procesar la imagen')
    ctx.drawImage(imageBitmap, 0, 0, width, height)

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Error al comprimir la imagen'))),
            'image/jpeg',
            quality,
        )
    })
}