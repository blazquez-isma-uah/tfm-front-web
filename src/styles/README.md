# Estilos Comunes

Este directorio contiene los estilos CSS reutilizables para toda la aplicación.

## Archivos

### `common.css`
Contiene estilos comunes para:
- **Contenedores de página**: `.page-container`, `.page-title`
- **Cards y secciones**: `.card`, `.section-title`, `.form-card`, `.toolbar`
- **Grids**: `.search-grid`, `.form-grid`, `.detail-grid`
- **Inputs y controles**: `.input-base`, `.input-full-width`, `.select-base`, `.textarea-base`
- **Botones**: `.button-primary`, `.button-secondary`, `.button-subtle`, `.button-danger`
- **Campos de formulario**: `.form-field`, `.label-text`
- **Detalles**: `.detail-item`, `.detail-label`, `.detail-value`
- **Utilidades**: `.search-actions-row`, `.ml-auto`

## Uso

Para usar los estilos comunes en un componente:

```tsx
import '../../styles/common.css'

function MyComponent() {
  return (
    <div className="page-container">
      <h1 className="page-title">Mi Página</h1>
      
      <div className="card">
        <h2 className="section-title">Sección</h2>
        {/* contenido */}
      </div>
      
      <form className="form-card">
        <div className="form-grid">
          <div className="form-field">
            <span className="label-text">Nombre</span>
            <input type="text" className="input-base" />
          </div>
        </div>
        
        <button type="submit" className="button-primary">
          Guardar
        </button>
      </form>
    </div>
  )
}
```

## Combinación de estilos

Puedes combinar clases CSS con estilos inline cuando sea necesario para valores específicos:

```tsx
<div className="card" style={{ marginTop: '2rem' }}>
  {/* contenido */}
</div>

<input className="input-base" style={{ minWidth: '200px' }} />
```

## Nuevas clases de utilidad

### Contenedores de acciones y botones
- `.actions-container` - Contenedor flex para botones de acciones (gap: 0.25rem)
- `.actions-container-wide` - Contenedor flex para botones de acciones (gap: 0.3rem)
- `.button-row` - Fila de botones alineada a la derecha (margin-top: 0.75rem)
- `.button-row-1rem` - Fila de botones alineada a la derecha (margin-top: 1rem)

### Mensajes
- `.error-message` - Mensaje de error con color rojo

### Grid
- `.grid-full-width` - Hace que un elemento ocupe todo el ancho del grid (grid-column: 1 / -1)

### Checkboxes
- `.checkbox-group` - Grupo de checkboxes con espaciado
- `.checkbox-label` - Label para checkbox con ícono y texto

### Instrumentos
- `.instruments-grid` - Grid de 5 columnas para listado de instrumentos
- `.instrument-group` - Grupo de instrumentos por letra
- `.instrument-group-title` - Título del grupo (letra)
- `.instrument-item` - Item individual de instrumento con checkbox

## Botones disponibles

- `.button-primary` - Botón principal azul
- `.button-secondary` - Botón secundario gris
- `.button-subtle` - Botón sutil gris claro
- `.button-danger` - Botón de peligro rojo

## Grids responsivos

Los grids se adaptan automáticamente al tamaño de la pantalla:
- `.search-grid` - Grid para filtros de búsqueda (mínimo 180px por columna)
- `.form-grid` - Grid para formularios (mínimo 220px por columna)
- `.detail-grid` - Grid para mostrar detalles (mínimo 260px por columna)
