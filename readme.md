# 🎁 Aplicación Web de Amigo Secreto (Estilo Pikkado)

Una aplicación web **mobile-first**, moderna y visualmente atractiva para organizar juegos de **Amigo Secreto / Amigo Invisible** sin necesidad de que los usuarios creen cuentas o inicien sesión.  
Cada participante recibe un **enlace único** para descubrir a quién debe regalar.

---

## 🚀 Descripción del Proyecto

Esta aplicación permite que un organizador cree un juego, registre participantes y asigne aleatoriamente a cada persona un "amigo secreto".  
El frontend se centra en la **experiencia móvil**, combinando **interfaz moderna (glassmorphism)** y un flujo intuitivo, mientras que el backend usa **FastAPI** para mantener el sistema ligero, rápido y escalable.

---

## 🎯 Alcance del Proyecto

### Objetivo principal
Ofrecer una experiencia simple, bonita y privada para sorteos de amigo secreto en línea sin autenticación.

### Funcionalidades incluidas
- Creación de un nuevo juego por parte del organizador.
- Registro de nombres de participantes.
- Generación de enlaces únicos y tokenizados.
- Asignación aleatoria sin autoasignaciones.
- Vista individual del resultado por participante.
- Diseño **mobile-first**, adaptable a cualquier dispositivo.

### Futuras mejoras
- Envío de invitaciones por correo o WhatsApp.
- Restricciones personalizadas (parejas, familiares, etc.).
- Persistencia avanzada en base de datos.
- Conversión a **PWA** instalable.

---

## 🧰 Lenguajes y Tecnologías

| Capa | Tecnología |
|-------|-------------|
| Frontend | **React + Vite + TailwindCSS** (con Glassmorphism) |
| Backend | **FastAPI (Python)** |
| Base de datos | JSON temporal / SQLite / Firebase |
| Hosting | Frontend: Vercel / Netlify · Backend: Render / Railway |

---

## ⚙️ Requisitos

### Requisitos funcionales
- Permitir crear un juego con una lista de participantes.  
- Generar un enlace único por participante con token seguro.  
- Impedir que una persona se asigne a sí misma.  
- Mostrar el resultado solo una vez por token.  

### Requisitos no funcionales
- Diseño **responsive y mobile-first**.
- Estética moderna con efecto **glass / liquid glass**.
- Carga rápida y navegación fluida.
- Código modular y mantenible.

---

## 🔄 Flujo del Sistema

1. **Creación del juego:** El organizador ingresa nombres y genera el juego.  
2. **Generación de tokens:** Se crean enlaces únicos, por ejemplo:  
   `https://amigosecreto.app/juego/ABC123/token/1f92f8a9`
3. **Asignación aleatoria:** El backend asigna pares sin autoasignaciones.
4. **Distribución de enlaces:** El organizador comparte los links con los participantes.  
5. **Visualización:** Cada participante ve a su amigo secreto al abrir su enlace.
6. **Control de acceso:** El token se marca como “visto” para evitar múltiples visualizaciones.

---

## 🏗️ Arquitectura del Proyecto

### Estructura de carpetas sugerida
```
project/
│
├── backend/
│   ├── main.py            # FastAPI app principal
│   ├── models.py          # Modelos Pydantic
│   ├── routes.py          # Endpoints REST
│   ├── utils.py           # Lógica de sorteo y tokens
│   └── data.json          # Almacenamiento temporal
│
├── frontend/
│   ├── src/
│   │   ├── components/    # GlassCard, Button, Layout...
│   │   ├── pages/         # CreateGame, GameLinks, ViewResult
│   │   └── App.tsx
│   └── index.html
│
└── README.md
```

### Endpoints principales (FastAPI)
```python
POST /api/games             # Crear nuevo juego
POST /api/games/{id}/draw   # Asignar aleatoriamente
GET  /api/games/{id}/{token} # Obtener amigo secreto asignado
```

---

## 🎨 Estilo y Diseño (Frontend)

El frontend usa **TailwindCSS** con estilo **Glassmorphism** (fondo translúcido, blur, sombras suaves):

```jsx
<div className="bg-white/10 backdrop-blur-md border border-white/30 rounded-3xl shadow-xl p-6">
  <h1 className="text-2xl font-semibold mb-2">🎁 Amigo Secreto</h1>
  <p className="text-sm text-slate-100/80">Te tocó <span className="font-bold">Carla</span></p>
</div>
```

### Paleta recomendada
- Fondo degradado: `from-slate-900 via-slate-950 to-emerald-900`
- Colores principales: **Esmeralda, blanco translúcido, morado tenue.**
- Tipografía moderna y legible (`Inter`, `Poppins`, o `Nunito`).

---

## 🧮 Ejemplo de Estructura de Datos

```json
{
  "game_id": "ABC123",
  "participants": [
    { "name": "Gary", "token": "1f92f8a9", "assigned_to": "Lily", "viewed": false },
    { "name": "Lily", "token": "a8c3e9d4", "assigned_to": "Robert", "viewed": true },
    { "name": "Robert", "token": "b9f1c2e5", "assigned_to": "Gary", "viewed": false }
  ]
}
```

---

## 💡 Ideas Futuras
- Envío de correos automáticos con enlaces.  
- Configuración de exclusiones personalizadas.  
- Panel de administración para el organizador.  
- Conversión en **Progressive Web App (PWA)**.

---

## 🧠 Objetivo para Codex

Generar:
- Endpoints REST (FastAPI).
- Lógica de sorteo aleatorio sin autoasignación.
- Componentes React con diseño glass y responsive.
- Manejo de tokens y persistencia ligera.

**Enfocado en:** claridad, estética y experiencia móvil perfecta.

---

## 📄 Licencia

Licencia MIT — libre para usar y modificar.