import api from '@/services/api'
import { ClienteParticular } from '@/lib/types'

export async function getClientesParticulares(): Promise<ClienteParticular[]> {
  const response = await api.get<ClienteParticular[]>('/clientes/particulares')
  return response.data
}
