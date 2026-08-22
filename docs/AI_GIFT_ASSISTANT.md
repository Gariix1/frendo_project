# AI Gift Assistant

Frendo incluye un asistente de regalos que integra un modelo generativo dentro de un flujo de negocio existente. El objetivo no es delegar toda la aplicación a la IA, sino usarla únicamente donde aporta valor: interpretar preferencias y proponer alternativas.

## Qué resuelve la IA

- Interpreta intereses, relación y notas opcionales del usuario.
- Usa la wishlist del amigo secreto como contexto.
- Genera hasta cinco ideas de regalo.
- Explica brevemente por qué cada opción puede encajar.
- Puede devolver una estimación de precio para ayudar a comparar opciones.

## Qué permanece en lógica tradicional

- Sorteo y asignación de participantes.
- Autenticación y acceso mediante token.
- Estado de enlaces y revelaciones.
- Validación del presupuesto.
- Persistencia de juegos y listas de deseos.
- Reglas de negocio y permisos.

El backend descarta cualquier sugerencia con precio estimado superior al presupuesto indicado. La IA nunca puede modificar el sorteo, participantes, permisos ni wishlist.

## Flujo

1. El participante revela su amigo secreto mediante el flujo normal de Frendo.
2. El frontend habilita el asistente.
3. El usuario indica presupuesto, intereses, relación y notas opcionales.
4. `POST /api/games/{game_id}/{token}/gift-suggestions` valida el token y el estado del juego.
5. El servicio construye un contexto limitado con los datos necesarios.
6. El modelo genera una respuesta JSON.
7. El backend parsea, deduplica y valida las sugerencias antes de devolverlas al cliente.

## Arquitectura

```text
React / TypeScript
       |
       v
/api/games/{game}/{token}/gift-suggestions
       |
       v
AI router (FastAPI)
       |
       v
ai_gift_service
  |            |
  |            +--> OpenAI Responses API
  |
  +--> GameRepository / SQLite
       |
       v
validación determinística de salida
```

## Configuración

Variables de entorno del backend:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
```

La clave se configura únicamente en el servidor y nunca se expone al frontend.

## Criterios de diseño

- **Separación de responsabilidades:** router, servicio de IA, repositorio y UI permanecen desacoplados.
- **Validación de entrada:** presupuesto, cantidad, longitud de textos e intereses tienen límites explícitos.
- **Validación de salida:** la respuesta del modelo se considera no confiable hasta ser parseada y revisada por el backend.
- **Privacidad por diseño:** solo se envía al modelo el contexto necesario para generar recomendaciones.
- **Fail closed:** si el servicio de IA no está configurado o devuelve una respuesta inválida, Frendo responde con un error controlado y el resto de la aplicación sigue funcionando.

## Por qué esta arquitectura

El sorteo necesita ser predecible y auditable, por lo que sigue siendo lógica tradicional. Las recomendaciones, en cambio, son una tarea abierta y subjetiva donde un modelo generativo puede aportar variedad y contexto. Esta separación permite aprovechar IA sin convertirla en una dependencia para las funciones críticas del producto.
