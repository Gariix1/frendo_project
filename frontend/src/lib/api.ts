const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

async function request(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    let message = res.statusText
    try {
      const data = await res.json()
      message = (data && (data.detail || data.message)) || JSON.stringify(data)
    } catch {
      try { message = await res.text() } catch {}
    }
    const err = new Error(message || res.statusText) as Error & { status?: number }
    err.status = res.status
    throw err
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return null
}

export const api = {
  createGame: (title: string, adminPassword: string, participants: string[]) =>
    request('/api/games', { method: 'POST', body: JSON.stringify({ title, admin_password: adminPassword, participants }) }),

  createGameByPeople: (title: string, adminPassword: string, personIds: string[]) =>
    request('/api/games', { method: 'POST', body: JSON.stringify({ title, admin_password: adminPassword, person_ids: personIds }) }),

  getStatus: (gameId: string, adminPassword: string) =>
    request(`/api/games/${gameId}`, { headers: { 'X-Admin-Password': adminPassword } }),

  getLinks: (gameId: string, adminPassword: string) =>
    request(`/api/games/${gameId}/links`, { headers: { 'X-Admin-Password': adminPassword } }),

  draw: (gameId: string, adminPassword: string, force = false) =>
    request(`/api/games/${gameId}/draw`, { method: 'POST', headers: { 'X-Admin-Password': adminPassword }, body: JSON.stringify({ force }) }),

  addParticipants: (gameId: string, adminPassword: string, participants: string[]) =>
    request(`/api/games/${gameId}/participants`, { method: 'POST', headers: { 'X-Admin-Password': adminPassword }, body: JSON.stringify({ participants }) }),

  addParticipantsByIds: (gameId: string, adminPassword: string, personIds: string[]) =>
    request(`/api/games/${gameId}/participants/by_ids`, { method: 'POST', headers: { 'X-Admin-Password': adminPassword }, body: JSON.stringify({ person_ids: personIds }) }),

  removeParticipant: (gameId: string, adminPassword: string, participantId: string) =>
    request(`/api/games/${gameId}/participants/${participantId}`, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } }),

  deactivate: (gameId: string, adminPassword: string, token: string) =>
    request(`/api/games/${gameId}/${token}/deactivate`, { method: 'POST', headers: { 'X-Admin-Password': adminPassword } }),

  reactivate: (gameId: string, adminPassword: string, token: string) =>
    request(`/api/games/${gameId}/${token}/reactivate`, { method: 'POST', headers: { 'X-Admin-Password': adminPassword } }),

  listGames: () => request('/api/games'),
  updateGameTitle: (gameId: string, adminPassword: string, title: string) =>
    request(`/api/games/${gameId}`, { method: 'PATCH', headers: { 'X-Admin-Password': adminPassword }, body: JSON.stringify({ title }) }),
  toggleGameActive: (gameId: string, adminPassword: string, active: boolean) =>
    request(`/api/games/${gameId}/${active ? 'reactivate_game' : 'deactivate_game'}`, { method: 'POST', headers: { 'X-Admin-Password': adminPassword } }),
  renameParticipant: (gameId: string, adminPassword: string, participantId: string, name: string) =>
    request(`/api/games/${gameId}/participants/${participantId}`, { method: 'PATCH', headers: { 'X-Admin-Password': adminPassword }, body: JSON.stringify({ name }) }),
  deleteGame: (gameId: string, adminPassword: string) =>
    request(`/api/games/${gameId}`, { method: 'DELETE', headers: { 'X-Admin-Password': adminPassword } }),

  // People directory (global)
  listPeople: () => request('/api/people'),
  addPeople: (names: string[], masterPassword?: string) =>
    request('/api/people', { method: 'POST', headers: masterPassword ? { 'X-Master-Password': masterPassword } : {}, body: JSON.stringify({ names }) }),
  renamePerson: (personId: string, name: string, masterPassword?: string) =>
    request(`/api/people/${personId}`, { method: 'PATCH', headers: masterPassword ? { 'X-Master-Password': masterPassword } : {}, body: JSON.stringify({ name }) }),
  togglePersonActive: (personId: string, active: boolean, masterPassword?: string) =>
    request(`/api/people/${personId}/${active ? 'reactivate' : 'deactivate'}`, { method: 'POST', headers: masterPassword ? { 'X-Master-Password': masterPassword } : {} }),

  preview: (gameId: string, token: string) => request(`/api/games/${gameId}/${token}`),
  reveal: (gameId: string, token: string) => request(`/api/games/${gameId}/${token}/reveal`, { method: 'POST' }),
}
