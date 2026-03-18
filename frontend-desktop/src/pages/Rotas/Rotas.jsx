import React, { useMemo, useState, useEffect } from 'react'
import {
  MdMap,
  MdAdd,
  MdSearch,
  MdExpandMore,
  MdChevronRight,
  MdDirectionsCar,
  MdAccessTime,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdPerson,
  MdGroup,
  MdEdit,
  MdDelete,
  MdRoute
} from 'react-icons/md'
import Card from '../../components/Card/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import { useDate } from '../../hooks/useFormatters'
import api from '../../services/api'
import './Rotas.css'

const ROTA_STATUS_ALIAS = {
  concluida: 'finalizada',
  concluido: 'finalizada'
}

const ROTA_STATUS_SEQUENCE = ['planejada', 'em_andamento', 'finalizada']

const normalizeRotaStatus = (status) => ROTA_STATUS_ALIAS[status] || status || 'planejada'

const Rotas = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroAtribuicao, setFiltroAtribuicao] = useState('todos') // 'todos', 'equipe', 'individual'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMapModalOpen, setIsMapModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [servicoToConcluir, setServicoToConcluir] = useState(null)
  const [rotaToDelete, setRotaToDelete] = useState(null)
  const [deleteRotaError, setDeleteRotaError] = useState(null)
  const [rotaToMap, setRotaToMap] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [localizationError, setLocalizationError] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [rotaToEdit, setRotaToEdit] = useState(null)
  const [expandedRotas, setExpandedRotas] = useState(() => new Set())
  const [rotaForm, setRotaForm] = useState({
    data: '',
    equipe_id: '',
    horario_inicio: '',
    horario_fim: '',
    status: 'planejada',
    servicos: []
  })
  const [equipeSugerida, setEquipeSugerida] = useState(null)

  const {
    data: rotasData,
    loading: rotasLoading,
    refetch: refetchRotas
  } = useApi('/rotas', 'GET', [])
  
  const { data: rotaServicosData } = useApi('/rota_servicos', 'GET', [])
  const { data: servicosData, refetch: refetchServicos } = useApi('/servicos', 'GET', [])
  const { data: equipesData } = useApi('/equipes', 'GET', [])
  const { data: usuariosData } = useApi('/usuarios', 'GET', [])
  const { data: servicoMontadoresData } = useApi('/servico_montadores', 'GET', [])

  const { formatDate } = useDate()
  const { user } = useAuth()
  const isAdmin = user?.tipo === 'admin'
  const isMontador = user?.tipo === 'montador'
  const canUpdateServico = isAdmin || isMontador

  const servicosMap = useMemo(() => {
    return (servicosData || []).reduce((acc, servico) => {
      acc[servico.id] = servico
      return acc
    }, {})
  }, [servicosData])

  const equipesMap = useMemo(() => {
    return (equipesData || []).reduce((acc, equipe) => {
      acc[equipe.id] = equipe
      return acc
    }, {})
  }, [equipesData])

  const montadoresList = useMemo(() => {
    return (usuariosData || []).filter((usuario) =>
      usuario.tipo === 'montador' || usuario.tipo === null || usuario.tipo === ''
    )
  }, [usuariosData])

  // Mapa de atribuições: identifica se cada serviço tem montadores individuais ou equipe
  const servicoAtribuicoesMap = useMemo(() => {
    const map = {}
    ;(servicoMontadoresData || []).forEach((sm) => {
      if (!map[sm.servico_id]) {
        map[sm.servico_id] = {
          tipo: null, // 'individual', 'equipe', 'misto'
          equipe_id: null,
          montadores: []
        }
      }
      
      if (sm.equipe_id) {
        map[sm.servico_id].tipo = map[sm.servico_id].tipo === 'individual' ? 'misto' : 'equipe'
        map[sm.servico_id].equipe_id = sm.equipe_id
      } else if (sm.usuario_id) {
        map[sm.servico_id].tipo = map[sm.servico_id].tipo === 'equipe' ? 'misto' : 'individual'
        map[sm.servico_id].montadores.push(sm.usuario_id)
      }
    })
    return map
  }, [servicoMontadoresData])

  const rotaServicosMap = useMemo(() => {
    const map = {}
    ;(rotaServicosData || []).forEach((rs) => {
      if (!map[rs.rota_id]) {
        map[rs.rota_id] = []
      }
      map[rs.rota_id].push(rs)
    })
    // Ordenar por ordem
    Object.keys(map).forEach((rotaId) => {
      map[rotaId].sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
    })
    return map
  }, [rotaServicosData])

  const servicosDisponiveis = useMemo(() => {
    let lista = (servicosData || []).filter((servico) =>
      servico.status === 'agendado' || servico.status === 'pendente'
    ).map((servico) => {
      const atribuicao = servicoAtribuicoesMap[servico.id] || { tipo: null }
      return {
        ...servico,
        atribuicao
      }
    })

    // Aplicar filtro de atribuição
    if (filtroAtribuicao === 'equipe') {
      lista = lista.filter(s => s.atribuicao.tipo === 'equipe' || s.atribuicao.tipo === 'misto')
    } else if (filtroAtribuicao === 'individual') {
      lista = lista.filter(s => s.atribuicao.tipo === 'individual' || s.atribuicao.tipo === 'misto')
    }

    return lista
  }, [servicosData, servicoAtribuicoesMap, filtroAtribuicao])

  // Detecta automaticamente a equipe sugerida quando serviços são selecionados
  useEffect(() => {
    if (rotaForm.servicos.length === 0) {
      setEquipeSugerida(null)
      return
    }

    const equipesIds = new Set()
    let todosTemEquipe = true

    rotaForm.servicos.forEach((servicoId) => {
      const atribuicao = servicoAtribuicoesMap[servicoId]
      if (atribuicao && atribuicao.equipe_id) {
        equipesIds.add(atribuicao.equipe_id)
      } else {
        todosTemEquipe = false
      }
    })

    // Se todos os serviços têm a mesma equipe, sugerir
    if (todosTemEquipe && equipesIds.size === 1) {
      const equipeId = Array.from(equipesIds)[0]
      setEquipeSugerida(equipeId)
      
      // Auto-preencher se ainda não foi selecionada manualmente
      if (!rotaForm.equipe_id) {
        setRotaForm((prev) => ({ ...prev, equipe_id: equipeId }))
      }
    } else if (equipesIds.size > 1) {
      setEquipeSugerida('multiplas')
    } else {
      setEquipeSugerida(null)
    }
  }, [rotaForm.servicos, servicoAtribuicoesMap, rotaForm.equipe_id])

  // Obter geolocalização em tempo real quando mapa abre
  useEffect(() => {
    if (!isMapModalOpen) {
      setCurrentLocation(null)
      setLocalizationError(null)
      return
    }

    // Tentar obter localização inicial
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
          setLocalizationError(null)
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          setLocalizationError('Não foi possível obter sua localização. Verifique as permissões do navegador.')
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )

      // Monitorar mudanças de localização em tempo real
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
          setLocalizationError(null)
        },
        (error) => {
          console.error('Erro ao monitorar localização:', error)
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      )

      // Limpar watch quando fechar o modal
      return () => {
        navigator.geolocation.clearWatch(watchId)
      }
    } else {
      setLocalizationError('Geolocalização não é suportada neste navegador')
    }
  }, [isMapModalOpen])

  const searchNormalized = searchTerm.trim().toLowerCase()

  const rotasList = useMemo(() => {
    const list = Array.isArray(rotasData) ? rotasData : []
    if (!searchNormalized) return list

    return list.filter((rota) => {
      const equipe = equipesMap[rota.equipe_id]
      const values = [
        formatDate(rota.data),
        equipe?.nome,
        rota.status
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [rotasData, searchNormalized, equipesMap, formatDate])

  const toggleRotaExpansion = (rotaId) => {
    setExpandedRotas((prev) => {
      const next = new Set(prev)
      if (next.has(rotaId)) {
        next.delete(rotaId)
      } else {
        next.add(rotaId)
      }
      return next
    })
  }

  const handleNovaRota = () => {
    if (!isAdmin) return

    const now = new Date()
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    setIsEditMode(false)
    setRotaToEdit(null)
    setRotaForm({
      data: localToday,
      equipe_id: '',
      horario_inicio: '08:00',
      horario_fim: '18:00',
      status: 'planejada',
      servicos: []
    })
    setEquipeSugerida(null)
    setFiltroAtribuicao('todos')
    setIsModalOpen(true)
  }

  const handleEditRota = async (rota) => {
    if (!isAdmin) return

    setIsEditMode(true)
    setRotaToEdit(rota)
    
    // Buscar serviços da rota
    const rotaServicos = rotaServicosMap[rota.id] || []
    const servicosIds = rotaServicos.map(rs => rs.servico_id)
    
    setRotaForm({
      data: rota.data,
      equipe_id: rota.equipe_id || '',
      horario_inicio: rota.horario_inicio || '08:00',
      horario_fim: rota.horario_fim || '18:00',
      status: normalizeRotaStatus(rota.status),
      servicos: servicosIds
    })
    setFiltroAtribuicao('todos')
    setIsModalOpen(true)
  }

  const handleDeleteRota = (rota) => {
    if (!isAdmin) return

    setDeleteRotaError(null)
    setRotaToDelete(rota)
    setIsDeleteModalOpen(true)
  }

  const cancelDeleteRota = () => {
    setIsDeleteModalOpen(false)
    setRotaToDelete(null)
    setDeleteRotaError(null)
  }

  const confirmDeleteRota = async () => {
    if (!rotaToDelete?.id) return

    try {
      setDeleteRotaError(null)
      await api.delete(`/rotas/${rotaToDelete.id}`)
      cancelDeleteRota()
      refetchRotas()
    } catch (err) {
      setDeleteRotaError(err.response?.data?.error || 'Não foi possível excluir a rota.')
    }
  }

  const handleToggleStatus = async (rota, e) => {
    e?.stopPropagation()

    if (!isAdmin) return

    const currentStatus = normalizeRotaStatus(rota.status)
    const currentIndex = ROTA_STATUS_SEQUENCE.indexOf(currentStatus)
    const nextStatus = ROTA_STATUS_SEQUENCE[(currentIndex + 1) % ROTA_STATUS_SEQUENCE.length]
    
    try {
      await api.put(`/rotas/${rota.id}`, {
        ...rota,
        status: nextStatus
      })
      refetchRotas()
    } catch (err) {
      console.error('Erro ao alterar status:', err)
    }
  }

  const handleConcluirServico = (servicoId, e) => {
    e?.stopPropagation()

    if (!canUpdateServico) return

    setServicoToConcluir(servicoId)
    setIsConfirmModalOpen(true)
  }

  const confirmConcluirServico = async () => {
    if (!servicoToConcluir) return
    
    try {
      // Apenas atualizar o status, sem enviar todos os campos
      await api.put(`/servicos/${servicoToConcluir}`, {
        status: 'concluido'
      })
      await refetchServicos()
      await refetchRotas()
      setIsConfirmModalOpen(false)
      setServicoToConcluir(null)
    } catch (err) {
      console.error('Erro ao concluir serviço:', err)
      alert('Erro ao marcar serviço como concluído')
    }
  }

  const cancelConcluirServico = () => {
    setIsConfirmModalOpen(false)
    setServicoToConcluir(null)
  }

  const handleViewMap = (rota) => {
    setRotaToMap(rota)
    setIsMapModalOpen(true)
  }

  const handleCancelarServico = async (servicoId, e) => {
    e?.stopPropagation()

    if (!canUpdateServico) return

    const confirmar = window.confirm('Deseja marcar este serviço como cancelado?')
    if (!confirmar) return

    try {
      await api.put(`/servicos/${servicoId}`, {
        status: 'cancelado'
      })
      await refetchServicos()
      await refetchRotas()
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível cancelar o serviço.')
    }
  }

  const handleAdicionarObservacao = async (servico, e) => {
    e?.stopPropagation()

    if (!canUpdateServico) return

    const observacaoAtual = servico?.observacoes || ''
    const novaObservacao = window.prompt('Adicionar/editar observação do serviço:', observacaoAtual)

    if (novaObservacao === null) {
      return
    }

    try {
      await api.put(`/servicos/${servico.id}`, {
        observacoes: novaObservacao.trim()
      })
      await refetchServicos()
      await refetchRotas()
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível salvar a observação.')
    }
  }

  const handleRotaSubmit = async (event) => {
    event.preventDefault()

    try {
      const servicosUnicos = [...new Set((rotaForm.servicos || []).filter(Boolean))]

      if (isEditMode && rotaToEdit) {
        // Atualizar rota existente
        await api.put(`/rotas/${rotaToEdit.id}`, {
          data: rotaForm.data,
          equipe_id: rotaForm.equipe_id || null,
          horario_inicio: rotaForm.horario_inicio,
          horario_fim: rotaForm.horario_fim,
          status: normalizeRotaStatus(rotaForm.status)
        })

        // Deletar todos os RotaServicos antigos
        let rotaServicos = rotaServicosMap[rotaToEdit.id] || []

        // Fallback: se o cache local ainda não carregou, busca no backend
        // para evitar conflito 409 ao recriar vínculos já existentes.
        if (rotaServicos.length === 0) {
          const rotaServicosResponse = await api.get('/rota_servicos', {
            params: { rota_id: rotaToEdit.id }
          })
          rotaServicos = Array.isArray(rotaServicosResponse.data) ? rotaServicosResponse.data : []
        }

        for (const rs of rotaServicos) {
          await api.delete(`/rota_servicos/${rs.id}`)
        }

        // Criar novos RotaServicos
        for (let i = 0; i < servicosUnicos.length; i++) {
          await api.post('/rota_servicos', {
            rota_id: rotaToEdit.id,
            servico_id: servicosUnicos[i],
            ordem: i + 1
          })
        }
      } else {
        // Criar nova rota
        const rotaResponse = await api.post('/rotas', {
          data: rotaForm.data,
          equipe_id: rotaForm.equipe_id || null,
          horario_inicio: rotaForm.horario_inicio,
          horario_fim: rotaForm.horario_fim,
          status: normalizeRotaStatus(rotaForm.status)
        })

        const rotaId = rotaResponse.data.id

        // Criar RotaServicos
        for (let i = 0; i < servicosUnicos.length; i++) {
          await api.post('/rota_servicos', {
            rota_id: rotaId,
            servico_id: servicosUnicos[i],
            ordem: i + 1
          })
        }
      }

      setIsModalOpen(false)
      refetchRotas()
    } catch (err) {
      alert(err.response?.data?.error || 'Não foi possível salvar a rota.')
    }
  }

  const getStatusIcon = (status) => {
    switch (normalizeRotaStatus(status)) {
      case 'finalizada':
        return <MdCheckCircle className="rotas__status-icon rotas__status-icon--success" />
      case 'em_andamento':
        return <MdAccessTime className="rotas__status-icon rotas__status-icon--warning" />
      default:
        return <MdPending className="rotas__status-icon rotas__status-icon--info" />
    }
  }

  const getStatusLabel = (status) => {
    switch (normalizeRotaStatus(status)) {
      case 'finalizada':
        return 'Concluída'
      case 'em_andamento':
        return 'Em andamento'
      default:
        return 'Planejada'
    }
  }

  const getAtribuicaoBadge = (atribuicao) => {
    if (!atribuicao || !atribuicao.tipo) {
      return <span className="rotas__badge rotas__badge--grey">Sem atribuição</span>
    }

    switch (atribuicao.tipo) {
      case 'equipe':
        return (
          <span className="rotas__badge rotas__badge--blue">
            <MdGroup /> Equipe
          </span>
        )
      case 'individual':
        return (
          <span className="rotas__badge rotas__badge--green">
            <MdPerson /> Montadores
          </span>
        )
      case 'misto':
        return (
          <span className="rotas__badge rotas__badge--orange">
            <MdGroup /> <MdPerson /> Misto
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="rotas">
      <div className="rotas__header">
        <div>
          <h1 className="rotas__title">Rotas</h1>
          <p className="rotas__subtitle">Planejamento e gerenciamento de rotas de serviço</p>
        </div>
        <button
          className="rotas__button"
          type="button"
          onClick={handleNovaRota}
          disabled={!isAdmin}
          title={isAdmin ? '' : 'Apenas administradores podem criar rotas'}
        >
          <MdAdd />
          Nova Rota
        </button>
      </div>

      <div className="rotas__toolbar">
        <div className="rotas__search">
          <MdSearch className="rotas__search-icon" />
          <input
            className="rotas__search-input"
            type="text"
            placeholder="Buscar rotas..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {rotasLoading ? (
        <Card>
          <div className="rotas__loading">Carregando rotas...</div>
        </Card>
      ) : rotasList.length === 0 ? (
        <Card>
          <div className="rotas__empty">
            <MdMap className="rotas__empty-icon" />
            <p>Nenhuma rota encontrada</p>
            <button
              className="rotas__button"
              type="button"
              onClick={handleNovaRota}
              disabled={!isAdmin}
              title={isAdmin ? '' : 'Apenas administradores podem criar rotas'}
            >
              Criar primeira rota
            </button>
          </div>
        </Card>
      ) : (
        <div className="rotas__list">
          {rotasList.map((rota) => {
            const isExpanded = expandedRotas.has(rota.id)
            const rotaServicos = rotaServicosMap[rota.id] || []
            const equipe = equipesMap[rota.equipe_id]

            return (
              <Card key={rota.id} className="rotas__card">
                <div className="rotas__card-container">
                  <div
                    className="rotas__card-header"
                    onClick={() => toggleRotaExpansion(rota.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="rotas__card-title">
                      {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                      <span>{formatDate(rota.data)}</span>
                      <span className="rotas__card-badge">
                        {equipe ? (
                          <><MdGroup /> {equipe.nome}</>
                        ) : (
                          <><MdPerson /> Individual</>
                        )}
                      </span>
                    </div>
                    <div className="rotas__card-info">
                      <div 
                        onClick={(e) => isAdmin && handleToggleStatus(rota, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: isAdmin ? 'pointer' : 'default' }}
                        title={isAdmin ? 'Clique para alterar status' : ''}
                      >
                        {getStatusIcon(rota.status)}
                        <span>{getStatusLabel(rota.status)}</span>
                      </div>
                      <span className="rotas__card-divider">•</span>
                      <MdDirectionsCar />
                      <span>{rota.km_total ? `${rota.km_total} km` : '—'}</span>
                      <span className="rotas__card-divider">•</span>
                      <MdAccessTime />
                      <span>
                        {rota.horario_inicio} - {rota.horario_fim}
                      </span>
                    </div>
                  </div>
                  
                  <div className="rotas__card-actions">
                    <button
                      className="rotas__action-btn rotas__action-btn--map"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewMap(rota)
                      }}
                      title="Ver mapa da rota"
                    >
                      <MdRoute />
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          className="rotas__action-btn rotas__action-btn--edit"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditRota(rota)
                          }}
                          title="Editar rota"
                        >
                          <MdEdit />
                        </button>
                        <button
                          className="rotas__action-btn rotas__action-btn--delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRota(rota)
                          }}
                          title="Excluir rota"
                        >
                          <MdDelete />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="rotas__card-body">
                    {rotaServicos.length === 0 ? (
                      <div className="rotas__empty-servicos">Nenhum serviço na rota</div>
                    ) : (
                      <div className="rotas__servicos-list">
                        {rotaServicos.map((rs, index) => {
                          const servico = servicosMap[rs.servico_id]
                          if (!servico) return null

                          const isConcluido = servico.status === 'concluido'
                          const lat = parseFloat(servico.latitude)
                          const lng = parseFloat(servico.longitude)
                          const semCoordenadas = isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0

                          return (
                            <div key={rs.id} className="rotas__servico-item">
                              <div className="rotas__servico-ordem">{index + 1}</div>
                              <div className="rotas__servico-content">
                                <div className="rotas__servico-codigo">
                                  {servico.codigo_servico}
                                  {semCoordenadas && !isConcluido && (
                                    <span style={{ 
                                      marginLeft: '0.5rem', 
                                      fontSize: '0.75rem', 
                                      color: '#f59e0b',
                                      background: '#fef3c7',
                                      padding: '0.125rem 0.375rem',
                                      borderRadius: '3px'
                                    }}>
                                      ⚠️ Sem GPS
                                    </span>
                                  )}
                                </div>
                                <div className="rotas__servico-endereco">
                                  {servico.endereco_execucao}
                                </div>
                                <div className="rotas__servico-info">
                                  {rs.horario_previsto_chegada && (
                                    <div className="rotas__servico-horario">
                                      <MdAccessTime />
                                      {rs.horario_previsto_chegada}
                                    </div>
                                  )}
                                  <div className="rotas__servico-status">
                                    <span className={`rotas__badge rotas__badge--${servico.status}`}>
                                      {servico.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {canUpdateServico && !isConcluido && servico.status !== 'cancelado' && (
                                <div className="rotas__servico-actions">
                                  <button
                                    className="rotas__servico-btn-concluir"
                                    onClick={(e) => handleConcluirServico(servico.id, e)}
                                    title="Marcar como concluído"
                                  >
                                    <MdCheckCircle />
                                  </button>
                                  <button
                                    className="rotas__servico-btn-concluir rotas__servico-btn-concluir--cancel"
                                    onClick={(e) => handleCancelarServico(servico.id, e)}
                                    title="Marcar como cancelado"
                                  >
                                    <MdCancel />
                                  </button>
                                  <button
                                    className="rotas__servico-btn-concluir rotas__servico-btn-concluir--note"
                                    onClick={(e) => handleAdicionarObservacao(servico, e)}
                                    title="Adicionar observação"
                                  >
                                    <MdEdit />
                                  </button>
                                </div>
                              )}
                              {canUpdateServico && servico.status === 'cancelado' && (
                                <button
                                  className="rotas__servico-btn-concluir rotas__servico-btn-concluir--note"
                                  onClick={(e) => handleAdicionarObservacao(servico, e)}
                                  title="Adicionar observação"
                                >
                                  <MdEdit />
                                </button>
                              )}
                              {isConcluido && (
                                <div className="rotas__servico-concluido">
                                  <MdCheckCircle />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="rotas__modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="rotas__modal" onClick={(event) => event.stopPropagation()}>
            <div className="rotas__modal-header">
              <h3>{isEditMode ? 'Editar Rota' : 'Nova Rota'}</h3>
              <button
                type="button"
                className="rotas__modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form className="rotas__modal-form" onSubmit={handleRotaSubmit}>
              <div className="rotas__form-grid">
                <label className="rotas__label">
                  Data *
                  <input
                    className="rotas__input"
                    type="date"
                    value={rotaForm.data}
                    onChange={(event) => setRotaForm((prev) => ({
                      ...prev,
                      data: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="rotas__label">
                  Equipe
                  <select
                    className="rotas__input"
                    value={rotaForm.equipe_id}
                    onChange={(event) => setRotaForm((prev) => ({
                      ...prev,
                      equipe_id: event.target.value
                    }))}
                  >
                    <option value="">Rota Individual (sem equipe)</option>
                    {(equipesData || []).map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </option>
                    ))}
                  </select>
                  <small className="rotas__label-hint">
                    Deixe vazio para rotas com montador individual
                  </small>
                </label>

                <label className="rotas__label">
                  Horário Início
                  <input
                    className="rotas__input"
                    type="time"
                    value={rotaForm.horario_inicio}
                    onChange={(event) => setRotaForm((prev) => ({
                      ...prev,
                      horario_inicio: event.target.value
                    }))}
                  />
                </label>

                <label className="rotas__label">
                  Horário Fim
                  <input
                    className="rotas__input"
                    type="time"
                    value={rotaForm.horario_fim}
                    onChange={(event) => setRotaForm((prev) => ({
                      ...prev,
                      horario_fim: event.target.value
                    }))}
                  />
                </label>

                <label className="rotas__label">
                  Status
                  <select
                    className="rotas__input"
                    value={rotaForm.status}
                    onChange={(event) => setRotaForm((prev) => ({
                      ...prev,
                      status: event.target.value
                    }))}
                  >
                    <option value="planejada">Planejada</option>
                    <option value="em_andamento">Em andamento</option>
                    <option value="finalizada">Concluída</option>
                  </select>
                </label>
              </div>

              <label className="rotas__label">
                Serviços
                <div className="rotas__filtro-atribuicao">
                  <button
                    type="button"
                    className={`rotas__filtro-btn ${filtroAtribuicao === 'todos' ? 'rotas__filtro-btn--active' : ''}`}
                    onClick={() => setFiltroAtribuicao('todos')}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    className={`rotas__filtro-btn ${filtroAtribuicao === 'equipe' ? 'rotas__filtro-btn--active' : ''}`}
                    onClick={() => setFiltroAtribuicao('equipe')}
                  >
                    <MdGroup /> Equipes
                  </button>
                  <button
                    type="button"
                    className={`rotas__filtro-btn ${filtroAtribuicao === 'individual' ? 'rotas__filtro-btn--active' : ''}`}
                    onClick={() => setFiltroAtribuicao('individual')}
                  >
                    <MdPerson /> Individuais
                  </button>
                </div>
                <select
                  className="rotas__input rotas__input--servicos"
                  multiple
                  size="8"
                  value={rotaForm.servicos}
                  onChange={(event) => {
                    const selected = Array.from(event.target.selectedOptions, option => option.value)
                    setRotaForm((prev) => ({
                      ...prev,
                      servicos: selected
                    }))
                  }}
                >
                  {servicosDisponiveis.length === 0 ? (
                    <option disabled>Nenhum serviço disponível</option>
                  ) : (
                    servicosDisponiveis.map((servico) => {
                      const atribuicaoLabel = 
                        servico.atribuicao?.tipo === 'equipe' ? '[Equipe] ' :
                        servico.atribuicao?.tipo === 'individual' ? '[Montadores] ' :
                        servico.atribuicao?.tipo === 'misto' ? '[Misto] ' : ''
                      
                      return (
                        <option key={servico.id} value={servico.id}>
                          {atribuicaoLabel}{servico.codigo_servico} - {servico.endereco_execucao}
                        </option>
                      )
                    })
                  )}
                </select>
                <small className="rotas__label-hint">
                  Use Ctrl/Cmd + clique para selecionar múltiplos serviços
                </small>
                {equipeSugerida && equipeSugerida !== 'multiplas' && (
                  <div className="rotas__equipe-sugerida">
                    <MdGroup />
                    <span>
                      Equipe sugerida: <strong>{equipesMap[equipeSugerida]?.nome}</strong>
                    </span>
                  </div>
                )}
                {equipeSugerida === 'multiplas' && (
                  <div className="rotas__equipe-alerta">
                    <MdCancel />
                    <span>Os serviços selecionados pertencem a equipes diferentes</span>
                  </div>
                )}
              </label>

              <div className="rotas__modal-actions">
                <button
                  type="button"
                  className="rotas__button rotas__button--ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="rotas__button">
                  {isEditMode ? 'Salvar Alterações' : 'Criar Rota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMapModalOpen && rotaToMap && (
        <div className="rotas__modal-backdrop" onClick={() => setIsMapModalOpen(false)}>
          <div className="rotas__modal rotas__modal--map" onClick={(e) => e.stopPropagation()}>
            <div className="rotas__modal-header">
              <h3>
                <MdRoute /> Mapa da Rota - {formatDate(rotaToMap.data)}
              </h3>
              <button
                type="button"
                className="rotas__modal-close"
                onClick={() => setIsMapModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="rotas__map-container">
              {(() => {
                // Validar localização
                if (localizationError) {
                  return (
                    <div className="rotas__map-empty">
                      <MdMap className="rotas__map-empty-icon" />
                      <p>Erro de Localização</p>
                      <small>{localizationError}</small>
                    </div>
                  )
                }

                if (!currentLocation) {
                  return (
                    <div className="rotas__map-empty">
                      <MdAccessTime className="rotas__map-empty-icon" />
                      <p>Obtendo sua localização...</p>
                      <small>Isto pode levar alguns segundos</small>
                    </div>
                  )
                }

                const rotaServicos = rotaServicosMap[rotaToMap.id] || []
                
                if (rotaServicos.length === 0) {
                  return (
                    <div className="rotas__map-empty">
                      <MdMap className="rotas__map-empty-icon" />
                      <p>Nenhum serviço cadastrado nesta rota</p>
                    </div>
                  )
                }

                // DEBUG: Log dos serviços para diagnóstico
                console.log('DEBUG - Serviços na rota:', rotaServicos.map(rs => {
                  const servico = servicosMap[rs.servico_id]
                  if (!servico) return { id: rs.servico_id, error: 'não encontrado' }
                  return {
                    id: servico.id,
                    codigo: servico.codigo_servico,
                    endereco: servico.endereco_execucao,
                    status: servico.status,
                    lat: servico.latitude,
                    lng: servico.longitude,
                    latParsed: parseFloat(servico.latitude),
                    lngParsed: parseFloat(servico.longitude),
                    latValid: !isNaN(parseFloat(servico.latitude)),
                    lngValid: !isNaN(parseFloat(servico.longitude)),
                    temCoordenadas: !isNaN(parseFloat(servico.latitude)) && !isNaN(parseFloat(servico.longitude))
                  }
                }))

                // Filtrar serviços ainda não concluídos e com coordenadas
                const proximosServicos = rotaServicos
                  .map((rs) => {
                    const servico = servicosMap[rs.servico_id]
                    
                    if (!servico) return null
                    
                    // Filtrar apenas serviços não concluídos
                    if (servico.status === 'concluido' || servico.status === 'cancelado') {
                      return null
                    }
                    
                    // Validar se tem coordenadas válidas
                    const lat = parseFloat(servico.latitude)
                    const lng = parseFloat(servico.longitude)
                    
                    // Validar se as coordenadas são números válidos
                    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                      return null
                    }
                    
                    return {
                      ordem: rs.ordem,
                      lat,
                      lng,
                      codigo: servico.codigo_servico,
                      endereco: servico.endereco_execucao,
                      status: servico.status
                    }
                  })
                  .filter(Boolean)
                
                // Contar serviços por categoria
                const servicosConcluidos = rotaServicos.filter(rs => {
                  const servico = servicosMap[rs.servico_id]
                  return servico && (servico.status === 'concluido' || servico.status === 'cancelado')
                }).length
                
                const servicosPendentes = rotaServicos.filter(rs => {
                  const servico = servicosMap[rs.servico_id]
                  return servico && servico.status !== 'concluido' && servico.status !== 'cancelado'
                }).length
                
                const servicosSemCoordenadas = rotaServicos.filter(rs => {
                  const servico = servicosMap[rs.servico_id]
                  if (!servico) return false
                  if (servico.status === 'concluido' || servico.status === 'cancelado') return false
                  const lat = parseFloat(servico.latitude)
                  const lng = parseFloat(servico.longitude)
                  return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0
                }).length
                
                // Lista dos serviços sem coordenadas para exibir
                const servicosSemCoordenadasDetalhes = rotaServicos
                  .map(rs => {
                    const servico = servicosMap[rs.servico_id]
                    if (!servico) return null
                    if (servico.status === 'concluido' || servico.status === 'cancelado') return null
                    const lat = parseFloat(servico.latitude)
                    const lng = parseFloat(servico.longitude)
                    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
                      return {
                        codigo: servico.codigo_servico || `ID: ${servico.id?.slice(0, 8)}`,
                        endereco: servico.endereco_execucao
                      }
                    }
                    return null
                  })
                  .filter(Boolean)

                if (proximosServicos.length === 0) {
                  // Verificar se todos foram realmente concluídos ou se faltam coordenadas
                  if (servicosConcluidos === rotaServicos.length) {
                    return (
                      <div className="rotas__map-empty">
                        <MdCheckCircle className="rotas__map-empty-icon" />
                        <p>Todos os serviços desta rota foram concluídos!</p>
                        <small>Excelente trabalho! 🎉</small>
                      </div>
                    )
                  } else if (servicosSemCoordenadas > 0) {
                    return (
                      <div className="rotas__map-empty">
                        <MdMap className="rotas__map-empty-icon" />
                        <p>Serviços pendentes sem coordenadas cadastradas</p>
                        <small>{servicosPendentes} pendente(s) - {servicosSemCoordenadas} sem localização - {servicosConcluidos} concluído(s)</small>
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <strong>Serviços sem localização:</strong>
                          <ul style={{ listStyle: 'none', padding: '0.5rem 0', margin: 0 }}>
                            {servicosSemCoordenadasDetalhes.map((s, idx) => (
                              <li key={idx} style={{ padding: '0.25rem 0' }}>
                                📍 {s.codigo} - {s.endereco}
                              </li>
                            ))}
                          </ul>
                          <small>Cadastre a latitude e longitude destes serviços para visualizar no mapa</small>
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <div className="rotas__map-empty">
                        <MdCheckCircle className="rotas__map-empty-icon" />
                        <p>Todos os serviços desta rota foram concluídos!</p>
                        <small>Excelente trabalho! 🎉</small>
                      </div>
                    )
                  }
                }

                // Próximo serviço é sempre o primeiro da lista (já ordenado)
                const proximoServico = proximosServicos[0]

                // Prioriza o endereço textual para manter consistência com o serviço exibido na lista.
                // Se o endereço estiver vazio, usa coordenadas como fallback.
                const destinoMapa = proximoServico.endereco?.trim()
                  ? encodeURIComponent(proximoServico.endereco)
                  : `${proximoServico.lat},${proximoServico.lng}`

                // Link externo para navegação no Waze.
                // Usa o mesmo destino exibido na lista para evitar divergência de cidade.
                const wazeUrl = `https://www.waze.com/ul?q=${destinoMapa}&navigate=yes`

                return (
                  <div className="rotas__map-content">
                    <div className="rotas__map-info">
                      <div className="rotas__map-stats">
                        <div className="rotas__map-stat">
                          <MdPending />
                          <span>{proximosServicos.length} serviço(s) pendente(s)</span>
                        </div>
                        <div className="rotas__map-stat">
                          <MdAccessTime />
                          <span>Próximo: #{proximoServico.ordem}</span>
                        </div>
                        <div className="rotas__map-stat">
                          <MdDirectionsCar />
                          <span>Precisão: ±{Math.round(currentLocation.accuracy)}m</span>
                        </div>
                        <a
                          href={wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rotas__map-open-link"
                        >
                          Abrir no Waze
                        </a>
                      </div>
                    </div>

                    <div className="rotas__map-frame">
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinoMapa}&language=pt-BR`}
                      ></iframe>
                    </div>

                    <div className="rotas__map-list">
                      <h4>Serviços Pendentes ({proximosServicos.length})</h4>
                      <div className="rotas__map-services">
                        {proximosServicos.map((servico, index) => (
                          <div 
                            key={index} 
                            className={`rotas__map-service-item ${index === 0 ? 'rotas__map-service-item--next' : ''}`}
                          >
                            <div className="rotas__map-service-number">
                              {index === 0 ? '→' : servico.ordem}
                            </div>
                            <div className="rotas__map-service-info">
                              <strong>{servico.codigo}</strong>
                              <span>{servico.endereco}</span>
                            </div>
                            {index === 0 && <MdRoute style={{ marginLeft: 'auto', color: 'var(--primary-color, #3b82f6)' }} />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && servicoToConcluir && (
        <div className="rotas__modal-backdrop" onClick={cancelConcluirServico}>
          <div className="rotas__modal rotas__modal--confirm" onClick={(e) => e.stopPropagation()}>
            <div className="rotas__modal-header">
              <h3>
                <MdCheckCircle /> Confirmar Conclusão
              </h3>
              <button
                type="button"
                className="rotas__modal-close"
                onClick={cancelConcluirServico}
              >
                ×
              </button>
            </div>

            <div className="rotas__modal-body">
              <div className="rotas__confirm-content">
                <div className="rotas__confirm-icon">
                  <MdCheckCircle />
                </div>
                <p className="rotas__confirm-text">
                  Tem certeza que deseja marcar este serviço como <strong>concluído</strong>?
                </p>
                {servicosMap[servicoToConcluir] && (
                  <div className="rotas__confirm-details">
                    <div className="rotas__confirm-detail">
                      <strong>Código:</strong> {servicosMap[servicoToConcluir].codigo_servico}
                    </div>
                    <div className="rotas__confirm-detail">
                      <strong>Endereço:</strong> {servicosMap[servicoToConcluir].endereco_execucao}
                    </div>
                  </div>
                )}
              </div>

              <div className="rotas__modal-actions">
                <button
                  type="button"
                  className="rotas__button rotas__button--ghost"
                  onClick={cancelConcluirServico}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="rotas__button rotas__button--success"
                  onClick={confirmConcluirServico}
                >
                  <MdCheckCircle /> Confirmar Conclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && rotaToDelete && (
        <div className="rotas__modal-backdrop" onClick={cancelDeleteRota}>
          <div className="rotas__modal rotas__modal--confirm" onClick={(e) => e.stopPropagation()}>
            <div className="rotas__modal-header">
              <h3>
                <MdDelete /> Confirmar Exclusão
              </h3>
              <button
                type="button"
                className="rotas__modal-close"
                onClick={cancelDeleteRota}
              >
                ×
              </button>
            </div>

            <div className="rotas__modal-body">
              <div className="rotas__confirm-content">
                <div className="rotas__confirm-icon rotas__confirm-icon--danger">
                  <MdDelete />
                </div>
                <p className="rotas__confirm-text">
                  Tem certeza que deseja excluir esta <strong>rota</strong>?
                </p>
                <div className="rotas__confirm-details">
                  <div className="rotas__confirm-detail">
                    <strong>Data:</strong> {formatDate(rotaToDelete.data)}
                  </div>
                  <div className="rotas__confirm-detail">
                    <strong>Equipe:</strong> {equipesMap[rotaToDelete.equipe_id]?.nome || 'Individual'}
                  </div>
                </div>
                {deleteRotaError && (
                  <div className="rotas__delete-error">
                    {deleteRotaError}
                  </div>
                )}
              </div>

              <div className="rotas__modal-actions">
                <button
                  type="button"
                  className="rotas__button rotas__button--ghost"
                  onClick={cancelDeleteRota}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="rotas__button rotas__button--danger"
                  onClick={confirmDeleteRota}
                >
                  <MdDelete /> Excluir Rota
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Rotas
