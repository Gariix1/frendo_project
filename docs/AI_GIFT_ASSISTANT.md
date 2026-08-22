# AI Gift Assistant

Frendo integra un modelo generativo dentro de un flujo de negocio existente. La idea no es delegar la aplicación a la IA, sino usarla únicamente donde aporta valor: interpretar preferencias y proponer alternativas.

## Qué resuelve la IA

- Interpreta intereses, relación y notas opcionales.
- Usa la wishlist del amigo secreto como contexto.
- Genera hasta cinco ideas de regalo.
- Explica por qué cada opción puede encajar.
- Puede devolver una estimación de precio.

## Qué permanece en lógica tradicional

- Sorteo y asignación de participantes.
- Autenticación y acceso mediante token.
- Estado de enlaces y revelaciones.
- Presupuesto y validación final de precios.
- Persistencia, permisos y reglas de negocio.
- Sesiones temporales y límite de consultas a IA.

La IA nunca puede modificar participantes, asignaciones, permisos ni wishlists. El backend descarta sugerencias cuyo precio estimado supere el presupuesto.

## Flujo seguro

1. Antes de revelar, el frontend solicita `POST /api/games/{game_id}/{token}/ai-session`.
2. El backend valida que el enlace siga activo, que exista un sorteo y que aún no haya sido revelado.
3. Se crea una sesión aleatoria de IA válida por 15 minutos, ligada a la versión actual del sorteo y limitada a 5 consultas.
4. El participante realiza el reveal normal. Si la sesión de IA no pudo crearse, el reveal continúa de todos modos.
5. Para pedir recomendaciones, el frontend envía la sesión temporal junto con presupuesto e intereses a `POST /api/games/{game_id}/{token}/gift-suggestions`.
6. El backend comprueba sesión, expiración, versión del sorteo, estado del reveal y límite de consultas.
7. Solo entonces se construye un contexto mínimo y se llama al modelo.
8. La salida del modelo se parsea, deduplica y valida antes de volver al cliente.

Una sesión de una versión anterior del sorteo deja de ser válida automáticamente después de un redraw.

## Arquitectura

```text
React / TypeScript
       |
       +--> POST /ai-session
       |        |
       |        v
       |   sesión efímera en SQLite
       |
       +--> reveal tradicional
       |
       +--> POST /gift-suggestions
                |
                v
          AI router (FastAPI)
                |
                v
          ai_gift_service
           |          |
           |          +--> OpenAI Responses API
           |
           +--> GameRepository / SQLite
                |
                v
          validación determinística
```

## Configuración

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

La API key vive únicamente en el servidor y nunca se expone al frontend.

## Criterios de diseño

- **Separación de responsabilidades:** router, servicio, repositorio y UI están desacoplados.
- **IA opcional:** un fallo de la integración no bloquea el flujo principal de Frendo.
- **Salida no confiable:** la respuesta del modelo se valida antes de usarse.
- **Privacidad por diseño:** el prompt no necesita ni envía el nombre del destinatario; solo contexto útil como intereses, notas y wishlist.
- **Control de costo/abuso:** la sesión expira y tiene un máximo de cinco consultas.
- **Fail closed:** sesiones inválidas, expiradas o de sorteos anteriores se rechazan.

## Por qué esta arquitectura

El sorteo necesita ser predecible y auditable, por lo que sigue siendo lógica tradicional. Las recomendaciones son abiertas y subjetivas, donde un modelo generativo sí aporta variedad y contexto. La separación permite usar IA sin convertirla en dependencia de las funciones críticas del producto.
