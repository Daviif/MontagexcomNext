import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdAccountBalanceWallet,
  MdAttachFile,
  MdAttachMoney,
  MdDelete,
  MdDownload,
  MdEdit,
  MdPayments,
  MdPrint,
  MdReceiptLong,
  MdSearch,
  MdExpandMore,
  MdChevronRight,
  MdUploadFile
} from 'react-icons/md'

import Card from '../../components/Card/Card'
import { useAuth } from '../../contexts/AuthContext'
import { useApi } from '../../hooks/useApi'
import { useCurrency, useDate } from '../../hooks/useFormatters'
import api from '../../services/api'
import './Financeiro.css'

const parseDateOnly = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      const [, year, month, day] = match
      return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0)
    }
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const formatDateOnlyPtBr = (value) => {
  const parsed = parseDateOnly(value)
  if (!parsed) return '-'
  return parsed.toLocaleDateString('pt-BR')
}

const getTodayDateOnly = () => {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

const INITIAL_DIALOG_STATE = {
  isOpen: false,
  title: 'Aviso',
  message: '',
  type: 'alert',
  onConfirm: null
}

const INITIAL_RECIBO_ASSINATURA = {
  assinaturaResponsavel: '',
  cpfCnpj: ''
}

const Financeiro = () => {
  const [activeTab, setActiveTab] = useState('salarios')
  const [searchTerm, setSearchTerm] = useState('')
  const [salarioDebugMode, setSalarioDebugMode] = useState(false)
  const [isDespesaModalOpen, setIsDespesaModalOpen] = useState(false)
  const [isRecebimentoModalOpen, setIsRecebimentoModalOpen] = useState(false)
  const [isPagamentoModalOpen, setIsPagamentoModalOpen] = useState(false)
  const [isBaixaModalOpen, setIsBaixaModalOpen] = useState(false)
  const [editingDespesaId, setEditingDespesaId] = useState(null)
  const [editingPagamentoId, setEditingPagamentoId] = useState(null)
  const [expandedMontadores, setExpandedMontadores] = useState(() => new Set())
  const [expandedRecebimentos, setExpandedRecebimentos] = useState(() => new Set())
  const [expandedSugestoesMontadores, setExpandedSugestoesMontadores] = useState(() => new Set())
  const [expandedSugestoesLojas, setExpandedSugestoesLojas] = useState(() => new Set())
  const [expandedPagamentosMontadores, setExpandedPagamentosMontadores] = useState(() => new Set())
  const [expandedPagamentosLojas, setExpandedPagamentosLojas] = useState(() => new Set())
  const [showOnlyPendingSugestoes, setShowOnlyPendingSugestoes] = useState(false)
  const [editingRecebimentoGrupo, setEditingRecebimentoGrupo] = useState(null)
  const [reciboGrupo, setReciboGrupo] = useState(null)
  const [reciboAssinatura, setReciboAssinatura] = useState(INITIAL_RECIBO_ASSINATURA)
  const [reciboMostrarOs, setReciboMostrarOs] = useState(true)
  const [baixaPagamentoContext, setBaixaPagamentoContext] = useState(null)
  const [isComprovantesModalOpen, setIsComprovantesModalOpen] = useState(false)
  const [comprovantesContext, setComprovantesContext] = useState(null)
  const [comprovantesData, setComprovantesData] = useState([])
  const [comprovantesLoading, setComprovantesLoading] = useState(false)
  const [comprovantesUploading, setComprovantesUploading] = useState(false)
  const [comprovantesDescricao, setComprovantesDescricao] = useState('')
  const fileInputRef = useRef(null)
  const [selectedPagamentos, setSelectedPagamentos] = useState(() => new Set())
  const [isBulkBaixaModalOpen, setIsBulkBaixaModalOpen] = useState(false)
  const [bulkBaixaForm, setBulkBaixaForm] = useState({ data_pagamento: '', forma_pagamento: '', observacoes: '' })
  const [isBulkBaixaSubmitting, setIsBulkBaixaSubmitting] = useState(false)
  const [bulkComprovanteContext, setBulkComprovanteContext] = useState(null)
  const [bulkComprovanteDescricao, setBulkComprovanteDescricao] = useState('')
  const [isBulkComprovanteUploading, setIsBulkComprovanteUploading] = useState(false)
  const bulkFileInputRef = useRef(null)
  const [recebimentoForm, setRecebimentoForm] = useState({
    status: 'pendente',
    valor_parcial: '',
    data_prevista: '',
    data_recebimento: '',
    forma_pagamento: '',
    observacoes: ''
  })
  const [despesaForm, setDespesaForm] = useState({
    categoria: 'Outros',
    valor: '',
    data_despesa: '',
    responsavel_id: '',
    descricao: ''
  })
  const [pagamentoForm, setPagamentoForm] = useState({
    usuario_id: '',
    servico_id: '',
    valor: '',
    data_vencimento: '',
    categoria: 'salario',
    origem: 'servico',
    status: 'pendente',
    observacoes: ''
  })
  const [baixaForm, setBaixaForm] = useState({
    valor: '',
    data_pagamento: getTodayDateOnly(),
    forma_pagamento: '',
    observacoes: ''
  })
  const [dialogState, setDialogState] = useState(INITIAL_DIALOG_STATE)
  const { user } = useAuth()
  const isAdmin = user?.tipo === 'admin'
  const isMontador = user?.tipo === 'montador'
  const salariosEndpoint = isAdmin
    ? `/dashboard/salarios${salarioDebugMode ? '?debug=1' : ''}`
    : '/health'

  const { data: salariosData, loading: salariosLoading } = useApi(salariosEndpoint)
  const {
    data: recebimentosData,
    loading: recebimentosLoading,
    refetch: refetchRecebimentos
  } = useApi('/recebimentos', 'GET', [])
  const {
    data: despesasData,
    loading: despesasLoading,
    refetch: refetchDespesas
  } = useApi('/despesas', 'GET', [])
  const {
    data: pagamentosData,
    loading: pagamentosLoading,
    refetch: refetchPagamentos
  } = useApi('/pagamentos_funcionarios', 'GET', [])
  const { data: usuariosData } = useApi('/usuarios', 'GET', [])
  const { data: servicosData } = useApi('/servicos', 'GET', [])
  const { data: produtosData } = useApi('/produtos', 'GET', [])
  const { data: servicoProdutosData } = useApi('/servico_produtos', 'GET', [])
  const { data: servicoMontadoresData } = useApi('/servico_montadores', 'GET', [])
  const { data: equipeMembrosData } = useApi('/equipe_membros', 'GET', [])
  const { data: lojasData } = useApi('/lojas', 'GET', [])
  const { data: particularesData } = useApi('/clientes_particulares', 'GET', [])

  const { formatDate } = useDate()
  const formatCurrency = useCurrency()

  const openAlertDialog = (message, title = 'Aviso') => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: null
    })
  }

  const openConfirmDialog = ({ title = 'Confirmação', message, onConfirm }) => {
    setDialogState({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: typeof onConfirm === 'function' ? onConfirm : null
    })
  }

  const closeDialog = () => {
    setDialogState(INITIAL_DIALOG_STATE)
  }

  const handleDialogConfirm = async () => {
    const action = dialogState.onConfirm
    closeDialog()

    if (action) {
      await action()
    }
  }

  useEffect(() => {
    if (isMontador && !['pagamentos', 'recebimentos'].includes(activeTab)) {
      setActiveTab('pagamentos')
      setSearchTerm('')
    }
  }, [isMontador, activeTab])

  const fetchComprovantes = useCallback(async (pagamentoId) => {
    setComprovantesLoading(true)
    try {
      const response = await api.get(`/pagamentos_funcionarios/${pagamentoId}/anexos`)
      setComprovantesData(response.data || [])
    } catch {
      setComprovantesData([])
    } finally {
      setComprovantesLoading(false)
    }
  }, [])

  const handleOpenComprovantes = useCallback((pagamento) => {
    setComprovantesContext(pagamento)
    setComprovantesDescricao('')
    setIsComprovantesModalOpen(true)
    fetchComprovantes(pagamento.id)
  }, [fetchComprovantes])

  const handleUploadComprovante = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !comprovantesContext) return
    event.target.value = ''
    setComprovantesUploading(true)
    try {
      const formData = new FormData()
      formData.append('arquivo', file)
      if (comprovantesDescricao) formData.append('descricao', comprovantesDescricao)
      await api.post(`/pagamentos_funcionarios/${comprovantesContext.id}/anexos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setComprovantesDescricao('')
      fetchComprovantes(comprovantesContext.id)
    } catch (err) {
      openAlertDialog(err.response?.data?.error || 'Não foi possível enviar o arquivo.', 'Erro')
    } finally {
      setComprovantesUploading(false)
    }
  }

  const handleDeleteComprovante = (anexo) => {
    openConfirmDialog({
      title: 'Confirmar Exclusão',
      message: `Deseja remover o arquivo "${anexo.nome_arquivo}"?`,
      onConfirm: async () => {
        try {
          await api.delete(`/pagamentos_funcionarios/anexos/${anexo.id}`)
          fetchComprovantes(comprovantesContext.id)
        } catch (err) {
          openAlertDialog(err.response?.data?.error || 'Não foi possível remover o arquivo.', 'Erro')
        }
      }
    })
  }

  const formatBytes = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleOpenRecibo = useCallback((grupo) => {
    setReciboGrupo(grupo)
    setReciboAssinatura(INITIAL_RECIBO_ASSINATURA)
    setReciboMostrarOs(true)
  }, [])

  const handleCloseRecibo = useCallback(() => {
    setReciboGrupo(null)
    setReciboAssinatura(INITIAL_RECIBO_ASSINATURA)
    setReciboMostrarOs(true)
  }, [])

  const reciboValorTotal = useMemo(() => {
    if (!reciboGrupo) return 0
    const valorRecebido = Number(reciboGrupo.totalRecebido || 0)
    const valorPrevisto = Number(reciboGrupo.totalPrevisto || 0)
    return valorRecebido > 0 ? valorRecebido : valorPrevisto
  }, [reciboGrupo])

  const reciboOsResumo = useMemo(() => {
    if (!reciboGrupo) return '-'
    const osList = (reciboGrupo.detalhesOs || [])
      .map((os) => os.numeroOS)
      .filter(Boolean)
    return osList.length > 0 ? osList.join(', ') : '-'
  }, [reciboGrupo])

  const reciboRazaoSocial = useMemo(() => {
    if (!reciboGrupo) return '-'
    return reciboGrupo.razaoSocial || reciboGrupo.razao_social || reciboGrupo.clienteNome || 'Cliente'
  }, [reciboGrupo])

  const handleOpenBulkBaixaModal = () => {
    setBulkBaixaForm({ data_pagamento: getTodayDateOnly(), forma_pagamento: '', observacoes: '' })
    setIsBulkBaixaModalOpen(true)
  }

  const handleSubmitBulkBaixa = async (event) => {
    event.preventDefault()
    setIsBulkBaixaSubmitting(true)
    const ids = [...selectedPagamentos]
    let successCount = 0
    let failCount = 0
    for (const id of ids) {
      const pagamento = pagamentosList.find((p) => p.id === id)
      if (!pagamento || pagamento.status === 'pago' || pagamento.saldo <= 0) continue
      try {
        await api.post(`/pagamentos_funcionarios/${id}/baixas`, {
          valor: pagamento.saldo,
          data_pagamento: bulkBaixaForm.data_pagamento || getTodayDateOnly(),
          forma_pagamento: bulkBaixaForm.forma_pagamento || null,
          observacoes: bulkBaixaForm.observacoes || null
        })
        successCount++
      } catch {
        failCount++
      }
    }
    setIsBulkBaixaSubmitting(false)
    setIsBulkBaixaModalOpen(false)
    setSelectedPagamentos(new Set())
    refetchPagamentos()
    if (failCount > 0) {
      openAlertDialog(`${successCount} baixado(s) com sucesso, ${failCount} falha(s).`, 'Atenção')
    } else {
      openAlertDialog(`${successCount} pagamento(s) baixado(s) com sucesso!`, 'Sucesso')
    }
  }

  const handleOpenBulkComprovanteFromLoja = (lojaGroup) => {
    const ids = (lojaGroup?.itens || [])
      .map((item) => item.id)
      .filter(Boolean)

    if (ids.length === 0) {
      openAlertDialog('Não há pagamentos lançados nesta loja/cliente para anexar comprovante.')
      return
    }

    setBulkComprovanteContext({
      montadorNome: lojaGroup.montadorNome,
      lojaNome: lojaGroup.lojaNome,
      pagamentoIds: ids
    })
    setBulkComprovanteDescricao('')
  }

  const handleUploadBulkComprovante = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !bulkComprovanteContext?.pagamentoIds?.length) return
    event.target.value = ''

    setIsBulkComprovanteUploading(true)
    let successCount = 0
    let failCount = 0

    for (const pagamentoId of bulkComprovanteContext.pagamentoIds) {
      try {
        const formData = new FormData()
        formData.append('arquivo', file)
        if (bulkComprovanteDescricao) formData.append('descricao', bulkComprovanteDescricao)

        await api.post(`/pagamentos_funcionarios/${pagamentoId}/anexos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        successCount++
      } catch {
        failCount++
      }
    }

    setIsBulkComprovanteUploading(false)
    setBulkComprovanteContext(null)
    setBulkComprovanteDescricao('')

    if (failCount > 0) {
      openAlertDialog(`Comprovante anexado em ${successCount} pagamento(s), com ${failCount} falha(s).`, 'Atenção')
    } else {
      openAlertDialog(`Comprovante anexado com sucesso em ${successCount} pagamento(s).`, 'Sucesso')
    }
  }

  const isLoading = salariosLoading || recebimentosLoading || despesasLoading || pagamentosLoading

  const usuariosMap = useMemo(() => {
    return (usuariosData || []).reduce((acc, usuario) => {
      acc[usuario.id] = usuario
      return acc
    }, {})
  }, [usuariosData])

  const responsaveisDespesasList = useMemo(() => {
    return (usuariosData || []).filter((usuario) =>
      usuario.tipo === 'admin' || usuario.tipo === 'montador' || usuario.tipo === null || usuario.tipo === ''
    )
  }, [usuariosData])

  const servicosMap = useMemo(() => {
    return (servicosData || []).reduce((acc, servico) => {
      acc[servico.id] = servico
      return acc
    }, {})
  }, [servicosData])

  const produtosMap = useMemo(() => {
    return (produtosData || []).reduce((acc, produto) => {
      acc[produto.id] = produto
      return acc
    }, {})
  }, [produtosData])

  const servicoProdutosPorServico = useMemo(() => {
    const map = {}
    ;(Array.isArray(servicoProdutosData) ? servicoProdutosData : []).forEach((item) => {
      if (!item?.servico_id) return
      if (!map[item.servico_id]) {
        map[item.servico_id] = []
      }
      map[item.servico_id].push(item)
    })
    return map
  }, [servicoProdutosData])

  const lojasMap = useMemo(() => {
    return (lojasData || []).reduce((acc, loja) => {
      acc[loja.id] = loja
      return acc
    }, {})
  }, [lojasData])

  const particularesMap = useMemo(() => {
    return (particularesData || []).reduce((acc, cliente) => {
      acc[cliente.id] = cliente
      return acc
    }, {})
  }, [particularesData])

  const periodoLabel = useMemo(() => {
    if (salariosData?.periodo?.mes && salariosData?.periodo?.ano) {
      return `${salariosData.periodo.mes} ${salariosData.periodo.ano}`
    }
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date())
  }, [salariosData])

  const periodoInfo = useMemo(() => {
    if (salariosData?.periodo?.inicio && salariosData?.periodo?.fim) {
      return {
        inicio: parseDateOnly(salariosData.periodo.inicio),
        fim: parseDateOnly(salariosData.periodo.fim)
      }
    }

    if (salariosData?.periodo?.mes && salariosData?.periodo?.ano) {
      const monthMap = {
        Jan: 0,
        Fev: 1,
        Mar: 2,
        Abr: 3,
        Mai: 4,
        Jun: 5,
        Jul: 6,
        Ago: 7,
        Set: 8,
        Out: 9,
        Nov: 10,
        Dez: 11
      }

      return {
        inicio: new Date(Number(salariosData.periodo.ano), monthMap[salariosData.periodo.mes], 1),
        fim: new Date(Number(salariosData.periodo.ano), monthMap[salariosData.periodo.mes] + 1, 0)
      }
    }

    return null
  }, [salariosData])

  const searchNormalized = searchTerm.trim().toLowerCase()

  const salariosList = useMemo(() => {
    const montadores = salariosData?.montadores || []
    if (!searchNormalized) return montadores

    return montadores.filter((montador) =>
      montador.nome?.toLowerCase().includes(searchNormalized)
    )
  }, [salariosData, searchNormalized])

  const salarioDetalhado = useMemo(() => {
    const montadoresApi = Array.isArray(salariosData?.montadores) ? salariosData.montadores : []

    const montadores = montadoresApi
      .map((montador) => {
        const itens = (montador.detalhes || []).map((detalhe, index) => {
          const servico = servicosMap[detalhe.servico_id]
          const numeroOS = detalhe.codigo_os_loja || detalhe.codigo_servico || detalhe.servico_id?.slice(0, 8)
          const clienteLabel = servico?.tipo_cliente === 'loja'
            ? lojasMap[servico.loja_id]?.nome || lojasMap[servico.loja_id]?.nome_fantasia || 'Loja'
            : servico
              ? (particularesMap[servico.cliente_particular_id]?.nome || 'Particular')
              : 'Cliente'

          return {
            montadorId: montador.usuario_id,
            servicoId: detalhe.servico_id,
            numeroOS,
            data: detalhe.data_servico,
            clienteLabel,
            valorCheio: Number(detalhe.valor_cheio || 0),
            valorCalculadoCliente: Number(detalhe.valor_calculado || 0),
            valorMontador: Number(detalhe.valor_atribuido || 0),
            debug: detalhe._debug || null,
            assignmentKey: `${detalhe.servico_id}-${montador.usuario_id}-${index}`
          }
        })

        const totalMontador = itens.reduce((acc, item) => acc + item.valorMontador, 0)

        return {
          montadorId: montador.usuario_id,
          nome: montador.nome || 'Montador',
          itens,
          totalMontador
        }
      })
      .sort((a, b) => a.nome.localeCompare(b.nome))

    const totalPorServico = new Map()
    montadores.forEach((montador) => {
      montador.itens.forEach((item) => {
        if (!totalPorServico.has(item.servicoId)) {
          totalPorServico.set(item.servicoId, {
            valorCheio: item.valorCheio,
            valorCalculadoCliente: item.valorCalculadoCliente
          })
        }
      })
    })

    const totalCheio = Array.from(totalPorServico.values())
      .reduce((acc, item) => acc + Number(item.valorCheio || 0), 0)
    const totalCalculado = Array.from(totalPorServico.values())
      .reduce((acc, item) => acc + Number(item.valorCalculadoCliente || 0), 0)
    const totalMontadores = montadores.reduce((acc, montador) => acc + montador.totalMontador, 0)

    return {
      montadores,
      totalCheio,
      totalCalculado,
      totalMontadores
    }
  }, [salariosData, servicosMap, lojasMap, particularesMap])

  const recebimentosPorServico = useMemo(() => {
    const map = {}
    ;(Array.isArray(recebimentosData) ? recebimentosData : []).forEach((item) => {
      if (!item?.servico_id) return
      if (!map[item.servico_id]) {
        map[item.servico_id] = []
      }
      map[item.servico_id].push(item)
    })
    return map
  }, [recebimentosData])

  const recebimentosList = useMemo(() => {
    const servicosConcluidos = (Array.isArray(servicosData) ? servicosData : [])
      .filter((servico) => servico.status === 'concluido')

    const grupos = new Map()

    servicosConcluidos.forEach((servico) => {
      const isLoja = servico.tipo_cliente === 'loja' && servico.loja_id
      const loja = isLoja ? lojasMap[servico.loja_id] : null
      const clienteKey = isLoja
        ? `loja:${servico.loja_id}`
        : `particular:${servico.cliente_particular_id || 'sem-id'}`
      const clienteNome = isLoja
        ? (loja?.razao_social || loja?.nome || loja?.nome_fantasia || 'Loja')
        : (particularesMap[servico.cliente_particular_id]?.nome || 'Cliente Particular')

      if (!grupos.has(clienteKey)) {
        grupos.set(clienteKey, {
          clienteKey,
          clienteNome,
          razaoSocial: isLoja
            ? (loja?.razao_social || loja?.nome || loja?.nome_fantasia || 'Loja')
            : clienteNome,
          tipoCliente: isLoja ? 'loja' : 'particular',
          servicos: []
        })
      }

      grupos.get(clienteKey).servicos.push(servico)
    })

    const lista = Array.from(grupos.values()).map((grupo) => {
      const detalhesOs = grupo.servicos.map((servico) => {
        const registros = recebimentosPorServico[servico.id] || []
        const registro = registros[registros.length - 1] || null
        const itensMontados = (servicoProdutosPorServico[servico.id] || []).map((item, index) => {
          const quantidade = Number(item.quantidade || 0)
          const valorUnitario = Number(item.valor_unitario || 0)
          const valorDesconto = Number(item.valor_desconto || 0)
          const subtotal = quantidade * valorUnitario
          const valorItem = Number(item.valor_total ?? Math.max(subtotal - valorDesconto, 0))
          const produto = produtosMap[item.produto_id]

          return {
            id: item.id || `${servico.id}-${item.produto_id || 'produto'}-${index}`,
            descricao: produto?.nome || 'Item sem descrição',
            quantidade,
            valorUnitario,
            valorItem
          }
        })

        const valorRecebidoServico = registros.reduce((sum, item) => {
          if (!['recebido', 'parcial'].includes(item.status)) return sum
          return sum + Number(item.valor || 0)
        }, 0)

        const valorTotalServico = Number(servico.valor_total || 0)
        let statusServico = 'pendente'
        if (valorRecebidoServico > 0 && valorRecebidoServico + 0.01 < valorTotalServico) {
          statusServico = 'parcial'
        } else if (valorTotalServico > 0 && valorRecebidoServico + 0.01 >= valorTotalServico) {
          statusServico = 'recebido'
        }

        return {
          servicoId: servico.id,
          numeroOS: servico.codigo_os_loja || servico.codigo_servico || servico.id?.slice(0, 8),
          valorTotal: valorTotalServico,
          valorRecebido: valorRecebidoServico,
          saldo: Math.max(valorTotalServico - valorRecebidoServico, 0),
          status: statusServico,
          dataPrevista: registro?.data_prevista || '',
          dataRecebimento: registro?.data_recebimento || '',
          formaPagamento: registro?.forma_pagamento || '',
          observacoes: registro?.observacoes || '',
          itensMontados
        }
      })

      const totalPrevisto = grupo.servicos
        .reduce((acc, servico) => acc + Number(servico.valor_total || 0), 0)

      const totalRecebido = grupo.servicos.reduce((acc, servico) => {
        const registros = recebimentosPorServico[servico.id] || []
        const valorServicoRecebido = registros.reduce((sum, registro) => {
          if (!['recebido', 'parcial'].includes(registro.status)) return sum
          return sum + Number(registro.valor || 0)
        }, 0)
        return acc + valorServicoRecebido
      }, 0)

      let status = 'pendente'
      if (totalRecebido > 0 && totalRecebido + 0.01 < totalPrevisto) {
        status = 'parcial'
      } else if (totalPrevisto > 0 && totalRecebido + 0.01 >= totalPrevisto) {
        status = 'recebido'
      }

      return {
        ...grupo,
        detalhesOs,
        totalPrevisto,
        totalRecebido,
        saldo: Math.max(totalPrevisto - totalRecebido, 0),
        totalOs: grupo.servicos.length,
        status
      }
    })

    if (!searchNormalized) return lista

    return lista.filter((item) => {
      const codigosOs = item.servicos
        .map((servico) => servico.codigo_os_loja || servico.codigo_servico || servico.id?.slice(0, 8))
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      const values = [item.clienteNome, item.status, item.tipoCliente, codigosOs]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [
    servicosData,
    lojasMap,
    particularesMap,
    recebimentosPorServico,
    searchNormalized,
    servicoProdutosPorServico,
    produtosMap
  ])

  const despesasList = useMemo(() => {
    const list = Array.isArray(despesasData) ? despesasData : []
    if (!searchNormalized) return list

    return list.filter((item) => {
      const responsavel = usuariosMap[item.responsavel_id]
      const values = [item.descricao, item.categoria, responsavel?.nome]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return values.includes(searchNormalized)
    })
  }, [despesasData, searchNormalized, usuariosMap])

  const pagamentosList = useMemo(() => {
    const list = Array.isArray(pagamentosData) ? pagamentosData : []

    const mapped = list.map((item) => {
      const valorPrevisto = Number(item.valor || 0)
      const valorPago = Number(item.valor_pago || 0)
      const saldo = Math.max(valorPrevisto - valorPago, 0)
      const servico = servicosMap[item.servico_id]
      const usuario = usuariosMap[item.usuario_id]
      const status = item.status || 'pendente'

      return {
        ...item,
        valorPrevisto,
        valorPago,
        saldo,
        status,
        usuarioNome: usuario?.nome || 'Sem usuário',
        numeroOS: servico?.codigo_os_loja || servico?.codigo_servico || item.servico_id?.slice(0, 8) || '-',
        dataVencimentoLabel: formatDateOnlyPtBr(item.data_vencimento),
        dataPagamentoLabel: formatDateOnlyPtBr(item.data_pagamento)
      }
    })

    if (!searchNormalized) return mapped

    return mapped.filter((item) => {
      const values = [
        item.usuarioNome,
        item.numeroOS,
        item.categoria,
        item.origem,
        item.status,
        item.observacoes
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return values.includes(searchNormalized)
    })
  }, [pagamentosData, servicosMap, usuariosMap, searchNormalized])

  const pagamentosSummary = useMemo(() => {
    return pagamentosList.reduce((acc, item) => {
      acc.totalPrevisto += Number(item.valorPrevisto || 0)
      acc.totalPago += Number(item.valorPago || 0)
      acc.totalSaldo += Number(item.saldo || 0)
      return acc
    }, {
      totalPrevisto: 0,
      totalPago: 0,
      totalSaldo: 0
    })
  }, [pagamentosList])

  const pagamentosHierarquia = useMemo(() => {
    const montadoresMap = new Map()

    pagamentosList.forEach((pagamento) => {
      const servico = servicosMap[pagamento.servico_id]
      const isLoja = servico?.tipo_cliente === 'loja' && servico?.loja_id
      const lojaId = isLoja ? servico.loja_id : `particular:${servico?.cliente_particular_id || 'sem-id'}`
      const lojaNome = isLoja
        ? (lojasMap[servico.loja_id]?.nome || lojasMap[servico.loja_id]?.nome_fantasia || 'Loja')
        : (particularesMap[servico?.cliente_particular_id]?.nome || 'Particular')

      if (!montadoresMap.has(pagamento.usuario_id)) {
        montadoresMap.set(pagamento.usuario_id, {
          montadorId: pagamento.usuario_id,
          montadorNome: pagamento.usuarioNome,
          lojas: new Map(),
          totalPrevisto: 0,
          totalPago: 0,
          totalSaldo: 0,
          totalPendentes: 0
        })
      }

      const montadorGroup = montadoresMap.get(pagamento.usuario_id)
      const lojaKey = `${pagamento.usuario_id}|${lojaId}`

      if (!montadorGroup.lojas.has(lojaKey)) {
        montadorGroup.lojas.set(lojaKey, {
          lojaKey,
          lojaNome,
          tipoCliente: isLoja ? 'loja' : 'particular',
          montadorNome: pagamento.usuarioNome,
          itens: [],
          totalPrevisto: 0,
          totalPago: 0,
          totalSaldo: 0,
          totalPendentes: 0
        })
      }

      const lojaGroup = montadorGroup.lojas.get(lojaKey)
      lojaGroup.itens.push(pagamento)
      lojaGroup.totalPrevisto += pagamento.valorPrevisto
      lojaGroup.totalPago += pagamento.valorPago
      lojaGroup.totalSaldo += pagamento.saldo
      if (pagamento.status !== 'pago') lojaGroup.totalPendentes += 1

      montadorGroup.totalPrevisto += pagamento.valorPrevisto
      montadorGroup.totalPago += pagamento.valorPago
      montadorGroup.totalSaldo += pagamento.saldo
      if (pagamento.status !== 'pago') montadorGroup.totalPendentes += 1
    })

    return Array.from(montadoresMap.values())
      .map((montador) => ({
        ...montador,
        lojas: Array.from(montador.lojas.values())
          .map((loja) => ({
            ...loja,
            itens: [...loja.itens].sort((a, b) => String(a.numeroOS || '').localeCompare(String(b.numeroOS || '')))
          }))
          .sort((a, b) => a.lojaNome.localeCompare(b.lojaNome))
      }))
      .sort((a, b) => a.montadorNome.localeCompare(b.montadorNome))
  }, [pagamentosList, servicosMap, lojasMap, particularesMap])

  const pagamentosByMontadorServico = useMemo(() => {
    return pagamentosList.reduce((acc, item) => {
      const key = `${item.usuario_id}|${item.servico_id}`
      if (!acc[key]) {
        acc[key] = item
        return acc
      }

      const atualData = parseDateOnly(acc[key].data_pagamento || acc[key].data_vencimento)
      const candidatoData = parseDateOnly(item.data_pagamento || item.data_vencimento)

      if (!atualData || (candidatoData && candidatoData.getTime() > atualData.getTime())) {
        acc[key] = item
      }

      return acc
    }, {})
  }, [pagamentosList])

  const pagamentosSugeridosSalario = useMemo(() => {
    return (salarioDetalhado.montadores || []).flatMap((montador) => {
      return (montador.itens || []).map((item) => {
        const key = `${montador.montadorId}|${item.servicoId}`
        const pagamentoExistente = pagamentosByMontadorServico[key] || null

        return {
          key: item.assignmentKey,
          montadorId: montador.montadorId,
          montadorNome: montador.nome,
          servicoId: item.servicoId,
          numeroOS: item.numeroOS,
          dataServico: item.data,
          valorSugerido: Number(item.valorMontador || 0),
          pagamentoExistente,
          statusLancamento: pagamentoExistente ? 'lancado' : 'pendente_lancamento'
        }
      })
    })
  }, [salarioDetalhado, pagamentosByMontadorServico])

  const sugestoesPagamentoHierarquia = useMemo(() => {
    const montadoresMap = new Map()

    pagamentosSugeridosSalario.forEach((sugestao) => {
      const servico = servicosMap[sugestao.servicoId]
      const isLoja = servico?.tipo_cliente === 'loja' && servico?.loja_id
      const lojaId = isLoja ? servico.loja_id : `particular:${servico?.cliente_particular_id || 'sem-id'}`
      const lojaNome = isLoja
        ? (lojasMap[servico.loja_id]?.nome || lojasMap[servico.loja_id]?.nome_fantasia || 'Loja')
        : (particularesMap[servico?.cliente_particular_id]?.nome || 'Particular')

      if (!montadoresMap.has(sugestao.montadorId)) {
        montadoresMap.set(sugestao.montadorId, {
          montadorId: sugestao.montadorId,
          montadorNome: sugestao.montadorNome,
          lojas: new Map(),
          totalValor: 0,
          totalPendentes: 0,
          totalLancados: 0
        })
      }

      const montadorGroup = montadoresMap.get(sugestao.montadorId)
      const lojaKey = `${sugestao.montadorId}|${lojaId}`

      if (!montadorGroup.lojas.has(lojaKey)) {
        montadorGroup.lojas.set(lojaKey, {
          lojaKey,
          lojaId,
          lojaNome,
          tipoCliente: isLoja ? 'loja' : 'particular',
          itens: [],
          totalValor: 0,
          totalPendentes: 0,
          totalLancados: 0
        })
      }

      const lojaGroup = montadorGroup.lojas.get(lojaKey)
      lojaGroup.itens.push(sugestao)
      lojaGroup.totalValor += Number(sugestao.valorSugerido || 0)

      if (sugestao.pagamentoExistente) {
        lojaGroup.totalLancados += 1
        montadorGroup.totalLancados += 1
      } else {
        lojaGroup.totalPendentes += 1
        montadorGroup.totalPendentes += 1
      }

      montadorGroup.totalValor += Number(sugestao.valorSugerido || 0)
    })

    return Array.from(montadoresMap.values())
      .map((montador) => ({
        ...montador,
        lojas: Array.from(montador.lojas.values())
          .map((loja) => ({
            ...loja,
            itens: [...loja.itens].sort((a, b) => {
              const da = parseDateOnly(a.dataServico)
              const db = parseDateOnly(b.dataServico)
              if (!da || !db) return String(a.numeroOS || '').localeCompare(String(b.numeroOS || ''))
              return da.getTime() - db.getTime()
            })
          }))
          .sort((a, b) => a.lojaNome.localeCompare(b.lojaNome))
      }))
      .sort((a, b) => a.montadorNome.localeCompare(b.montadorNome))
  }, [pagamentosSugeridosSalario, servicosMap, lojasMap, particularesMap])

  const sugestoesPagamentoHierarquiaFiltrada = useMemo(() => {
    if (!showOnlyPendingSugestoes) {
      return sugestoesPagamentoHierarquia
    }

    return sugestoesPagamentoHierarquia
      .map((montador) => {
        const lojasFiltradas = montador.lojas
          .map((loja) => {
            const itensPendentes = loja.itens.filter((item) => !item.pagamentoExistente)
            return {
              ...loja,
              itens: itensPendentes,
              totalValor: itensPendentes.reduce((acc, item) => acc + Number(item.valorSugerido || 0), 0),
              totalPendentes: itensPendentes.length,
              totalLancados: 0
            }
          })
          .filter((loja) => loja.itens.length > 0)

        return {
          ...montador,
          lojas: lojasFiltradas,
          totalValor: lojasFiltradas.reduce((acc, loja) => acc + loja.totalValor, 0),
          totalPendentes: lojasFiltradas.reduce((acc, loja) => acc + loja.totalPendentes, 0),
          totalLancados: 0
        }
      })
      .filter((montador) => montador.lojas.length > 0)
  }, [sugestoesPagamentoHierarquia, showOnlyPendingSugestoes])

  const actionLabel = useMemo(() => {
    if (isMontador) {
      return ''
    }

    switch (activeTab) {
      case 'pagamentos':
        return 'Novo Pagamento'
      case 'despesas':
        return 'Nova Despesa'
      default:
        return ''
    }
  }, [activeTab, isMontador])

  const totalSalarios = salariosData?.totais?.total_salarios || 0

  const handleActionClick = () => {
    if (activeTab === 'pagamentos') {
      setEditingPagamentoId(null)
      setPagamentoForm({
        usuario_id: '',
        servico_id: '',
        valor: '',
        data_vencimento: '',
        categoria: 'salario',
        origem: 'servico',
        status: 'pendente',
        observacoes: ''
      })
      setIsPagamentoModalOpen(true)
      return
    }

    if (activeTab === 'despesas') {
      setEditingDespesaId(null)
      setDespesaForm({
        categoria: 'Outros',
        valor: '',
        data_despesa: '',
        responsavel_id: '',
        descricao: ''
      })
      setIsDespesaModalOpen(true)
    }
  }

  const handleEditPagamento = (pagamento) => {
    setEditingPagamentoId(pagamento.id)
    setPagamentoForm({
      usuario_id: pagamento.usuario_id || '',
      servico_id: pagamento.servico_id || '',
      valor: pagamento.valor != null ? String(pagamento.valor) : '',
      data_vencimento: (pagamento.data_vencimento || '').slice(0, 10),
      categoria: pagamento.categoria || 'salario',
      origem: pagamento.origem || 'servico',
      status: pagamento.status || 'pendente',
      observacoes: pagamento.observacoes || ''
    })
    setIsPagamentoModalOpen(true)
  }

  const handleLaunchPagamentoFromSalario = (sugestao) => {
    if (sugestao.pagamentoExistente) {
      handleEditPagamento(sugestao.pagamentoExistente)
      return
    }

    setEditingPagamentoId(null)
    setPagamentoForm({
      usuario_id: sugestao.montadorId || '',
      servico_id: sugestao.servicoId || '',
      valor: sugestao.valorSugerido ? sugestao.valorSugerido.toFixed(2) : '',
      data_vencimento: '',
      categoria: 'salario',
      origem: 'servico',
      status: 'pendente',
      observacoes: `Gerado a partir do cálculo salarial da OS ${sugestao.numeroOS}`
    })
    setIsPagamentoModalOpen(true)
  }

  const handleBulkBaixaFromLoja = (lojaGroup) => {
    const lancadosNaoPagos = (lojaGroup?.itens || [])
      .filter((item) => item.pagamentoExistente && item.pagamentoExistente.status !== 'pago' && item.pagamentoExistente.saldo > 0)
      .map((item) => item.pagamentoExistente.id)

    if (lancadosNaoPagos.length === 0) {
      openAlertDialog('Todos os pagamentos desta loja/cliente já estão quitados.')
      return
    }

    setSelectedPagamentos(new Set(lancadosNaoPagos))
    handleOpenBulkBaixaModal()
  }

  const handleBulkBaixaFromPagamentoLoja = (lojaGroup) => {
    const ids = (lojaGroup?.itens || [])
      .filter((item) => item.status !== 'pago' && Number(item.saldo || 0) > 0)
      .map((item) => item.id)

    if (ids.length === 0) {
      openAlertDialog('Todos os pagamentos desta loja/cliente já estão quitados.')
      return
    }

    setSelectedPagamentos(new Set(ids))
    handleOpenBulkBaixaModal()
  }

  const handleLaunchLoteLoja = async (lojaGroup) => {
    const pendentes = (lojaGroup?.itens || []).filter((item) => !item.pagamentoExistente)

    if (pendentes.length === 0) {
      openAlertDialog('Todas as OS dessa loja já estão lançadas para este montador.')
      return
    }

    const total = pendentes.reduce((acc, item) => acc + Number(item.valorSugerido || 0), 0)

    openConfirmDialog({
      title: 'Confirmar Lançamento em Lote',
      message: `Lançar ${pendentes.length} OS da loja ${lojaGroup.lojaNome} para ${lojaGroup.itens[0]?.montadorNome}?\nTotal: ${formatCurrency(total)}`,
      onConfirm: async () => {
        try {
          for (const item of pendentes) {
            const payload = {
              usuario_id: item.montadorId,
              servico_id: item.servicoId,
              valor: Number(item.valorSugerido || 0),
              valor_pago: 0,
              data_vencimento: null,
              data_pagamento: null,
              categoria: 'salario',
              origem: 'servico',
              status: 'pendente',
              observacoes: `Lançamento em lote (${lojaGroup.lojaNome}) - OS ${item.numeroOS}`,
              responsavel_id: user?.id || null
            }

            await api.post('/pagamentos_funcionarios', payload)
          }

          refetchPagamentos()
          openAlertDialog(`Lançamento concluído: ${pendentes.length} OS da loja ${lojaGroup.lojaNome}.`, 'Sucesso')
        } catch (err) {
          openAlertDialog(err.response?.data?.error || 'Não foi possível lançar os pagamentos em lote.', 'Erro')
        }
      }
    })
  }

  const handleOpenBaixaModal = (pagamento) => {
    const saldo = Math.max(Number(pagamento.valorPrevisto || 0) - Number(pagamento.valorPago || 0), 0)
    setBaixaPagamentoContext(pagamento)
    setBaixaForm({
      valor: saldo > 0 ? saldo.toFixed(2) : '',
      data_pagamento: getTodayDateOnly(),
      forma_pagamento: '',
      observacoes: ''
    })
    setIsBaixaModalOpen(true)
  }

  const handleSubmitPagamento = async (event) => {
    event.preventDefault()

    const valor = Number(String(pagamentoForm.valor || '0').replace(',', '.'))
    if (Number.isNaN(valor) || valor <= 0) {
      openAlertDialog('Informe um valor válido para o pagamento.')
      return
    }

    const status = pagamentoForm.status || 'pendente'
    const isPago = status === 'pago'

    try {
      const payload = {
        usuario_id: pagamentoForm.usuario_id,
        servico_id: pagamentoForm.servico_id,
        valor,
        valor_pago: isPago ? valor : 0,
        data_vencimento: pagamentoForm.data_vencimento || null,
        data_pagamento: isPago ? getTodayDateOnly() : null,
        categoria: pagamentoForm.categoria || 'salario',
        origem: pagamentoForm.origem || 'servico',
        status,
        observacoes: pagamentoForm.observacoes || null,
        responsavel_id: user?.id || null
      }

      if (editingPagamentoId) {
        await api.put(`/pagamentos_funcionarios/${editingPagamentoId}`, payload)
      } else {
        await api.post('/pagamentos_funcionarios', payload)
      }

      setIsPagamentoModalOpen(false)
      setEditingPagamentoId(null)
      refetchPagamentos()
    } catch (err) {
      openAlertDialog(err.response?.data?.error || 'Não foi possível salvar o pagamento.', 'Erro')
    }
  }

  const handleSubmitBaixa = async (event) => {
    event.preventDefault()
    if (!baixaPagamentoContext) return

    const valor = Number(String(baixaForm.valor || '0').replace(',', '.'))
    if (Number.isNaN(valor) || valor <= 0) {
      openAlertDialog('Informe um valor de baixa válido.')
      return
    }

    try {
      await api.post(`/pagamentos_funcionarios/${baixaPagamentoContext.id}/baixas`, {
        valor,
        data_pagamento: baixaForm.data_pagamento || getTodayDateOnly(),
        forma_pagamento: baixaForm.forma_pagamento || null,
        observacoes: baixaForm.observacoes || null
      })

      setIsBaixaModalOpen(false)
      setBaixaPagamentoContext(null)
      refetchPagamentos()
    } catch (err) {
      const detailsMessage = err.response?.data?.details?.[0]?.message
      openAlertDialog(detailsMessage || err.response?.data?.error || 'Não foi possível registrar a baixa.', 'Erro')
    }
  }

  const handleEditDespesa = (despesa) => {
    setEditingDespesaId(despesa.id)
    setDespesaForm({
      categoria: despesa.categoria || 'Outros',
      valor: despesa.valor != null ? String(despesa.valor) : '',
      data_despesa: despesa.data_despesa ? despesa.data_despesa.split('T')[0] : '',
      responsavel_id: despesa.responsavel_id || '',
      descricao: despesa.descricao || ''
    })
    setIsDespesaModalOpen(true)
  }

  const handleDeletePagamento = (pagamento) => {
    openConfirmDialog({
      title: 'Confirmar Exclusão',
      message: 'Deseja remover este pagamento? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        try {
          await api.delete(`/pagamentos_funcionarios/${pagamento.id}`)
          refetchPagamentos()
        } catch (err) {
          openAlertDialog(err.response?.data?.error || 'Não foi possível remover o pagamento.', 'Erro')
        }
      }
    })
  }

  const handleDeleteDespesa = async (despesa) => {
    openConfirmDialog({
      title: 'Confirmar Exclusão',
      message: 'Deseja remover esta despesa?',
      onConfirm: async () => {
        try {
          await api.delete(`/despesas/${despesa.id}`)
          refetchDespesas()
        } catch (err) {
          openAlertDialog(err.response?.data?.error || 'Não foi possível remover a despesa.', 'Erro')
        }
      }
    })
  }

  const handleOpenEditRecebimento = (grupo) => {
    const saldoGrupo = Number(grupo.saldo || 0)
    if (saldoGrupo <= 0) {
      openAlertDialog('Este cliente já está totalmente recebido.')
      return
    }

    setEditingRecebimentoGrupo(grupo)
    setRecebimentoForm({
      status: 'parcial',
      valor_parcial: Number(saldoGrupo).toFixed(2),
      data_prevista: '',
      data_recebimento: getTodayDateOnly(),
      forma_pagamento: '',
      observacoes: ''
    })
    setIsRecebimentoModalOpen(true)
  }

  const handleSubmitRecebimento = async (event) => {
    event.preventDefault()
    if (!editingRecebimentoGrupo) return

    const statusSelecionado = recebimentoForm.status || 'pendente'
    const totalSaldoGrupo = Number(editingRecebimentoGrupo.saldo || 0)

    let totalParaDistribuir = 0
    if (statusSelecionado === 'recebido') {
      totalParaDistribuir = totalSaldoGrupo
    } else if (statusSelecionado === 'parcial') {
      const valorParcial = Number(String(recebimentoForm.valor_parcial || '0').replace(',', '.'))
      if (Number.isNaN(valorParcial) || valorParcial < 0) {
        openAlertDialog('Informe um valor parcial válido.')
        return
      }
      totalParaDistribuir = Math.min(valorParcial, totalSaldoGrupo)
    }

    if (totalParaDistribuir <= 0) {
      openAlertDialog('Não há saldo para lançar neste recebimento.')
      return
    }

    try {
      let restante = totalParaDistribuir
      let lancamentosCriados = 0

      for (const servico of editingRecebimentoGrupo.servicos) {
        const valorServico = Number(servico.valor_total || 0)
        const registros = recebimentosPorServico[servico.id] || []
        const valorJaRecebido = registros.reduce((sum, item) => {
          if (!['recebido', 'parcial'].includes(item.status)) return sum
          return sum + Number(item.valor || 0)
        }, 0)
        const saldoServico = Math.max(valorServico - valorJaRecebido, 0)

        if (saldoServico <= 0 || restante <= 0) continue

        let valorRecebimento = 0
        let statusFinal = 'pendente'

        if (statusSelecionado === 'recebido') {
          valorRecebimento = saldoServico
          statusFinal = 'recebido'
        } else if (statusSelecionado === 'parcial') {
          valorRecebimento = Math.max(0, Math.min(saldoServico, restante))
          if (valorJaRecebido + valorRecebimento + 0.01 >= valorServico) {
            statusFinal = 'recebido'
          } else if (valorRecebimento > 0) {
            statusFinal = 'parcial'
          }
          restante -= valorRecebimento
        }

        if (valorRecebimento <= 0) continue

        const payload = {
          servico_id: servico.id,
          valor: Number(valorRecebimento.toFixed(2)),
          data_prevista: recebimentoForm.data_prevista || null,
          data_recebimento: statusFinal === 'pendente' ? null : (recebimentoForm.data_recebimento || null),
          status: statusFinal,
          forma_pagamento: recebimentoForm.forma_pagamento || null,
          observacoes: recebimentoForm.observacoes || null
        }

        await api.post('/recebimentos', payload)
        lancamentosCriados += 1
      }

      if (lancamentosCriados === 0) {
        openAlertDialog('Nenhum novo lançamento foi criado. Verifique o saldo das OS selecionadas.')
        return
      }

      setIsRecebimentoModalOpen(false)
      setEditingRecebimentoGrupo(null)
      refetchRecebimentos()
    } catch (err) {
      openAlertDialog(err.response?.data?.error || 'Não foi possível lançar o recebimento.', 'Erro')
    }
  }

  const handleDespesaSubmit = async (event) => {
    event.preventDefault()

    try {
      const payload = {
        descricao: despesaForm.descricao || 'Despesa registrada',
        categoria: despesaForm.categoria || null,
        valor: despesaForm.valor ? Number(despesaForm.valor) : 0,
        data_despesa: despesaForm.data_despesa,
        responsavel_id: despesaForm.responsavel_id || null
      }

      if (editingDespesaId) {
        await api.put(`/despesas/${editingDespesaId}`, payload)
      } else {
        await api.post('/despesas', payload)
      }

      setIsDespesaModalOpen(false)
      setEditingDespesaId(null)
      refetchDespesas()
    } catch (err) {
      openAlertDialog(err.response?.data?.error || 'Não foi possível salvar a despesa.', 'Erro')
    }
  }

  return (
    <div className="financeiro">
      <div className="financeiro__header">
        <div>
          <h1 className="financeiro__title">Financeiro</h1>
          <p className="financeiro__subtitle">Controle de recebimentos e despesas</p>
        </div>
        {actionLabel && (
          <button className="financeiro__button" type="button" onClick={handleActionClick}>
            {actionLabel}
          </button>
        )}
      </div>

      <div className="financeiro__tabs">
        {!isMontador && (
          <button
            type="button"
            className={`financeiro__tab ${activeTab === 'salarios' ? 'financeiro__tab--active' : ''}`}
            onClick={() => {
              setActiveTab('salarios')
              setSearchTerm('')
            }}
          >
            <MdAccountBalanceWallet />
            Salários
          </button>
        )}
        <button
          type="button"
          className={`financeiro__tab ${activeTab === 'pagamentos' ? 'financeiro__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('pagamentos')
            setSearchTerm('')
          }}
        >
          <MdPayments />
          Pagamentos
        </button>

        <button
          type="button"
          className={`financeiro__tab ${activeTab === 'recebimentos' ? 'financeiro__tab--active' : ''}`}
          onClick={() => {
            setActiveTab('recebimentos')
            setSearchTerm('')
          }}
        >
          <MdAttachMoney />
          Recebimentos
        </button>
        {!isMontador && (
          <button
            type="button"
            className={`financeiro__tab ${activeTab === 'despesas' ? 'financeiro__tab--active' : ''}`}
            onClick={() => {
              setActiveTab('despesas')
              setSearchTerm('')
            }}
          >
            <MdReceiptLong />
            Despesas
          </button>
        )}
      </div>

      <div className="financeiro__toolbar">
        <div className="financeiro__search">
          <MdSearch className="financeiro__search-icon" />
          <input
            className="financeiro__search-input"
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {isLoading && (
        <div className="financeiro__loading">Carregando...</div>
      )}

      {!isLoading && !isMontador && activeTab === 'salarios' && (
        <Card
          title={`Salários - ${periodoLabel}`}
          extra={(
            <div className="financeiro__card-extra">
              <span className="financeiro__badge">100% do valor</span>
              <button
                type="button"
                className={`financeiro__debug-toggle ${salarioDebugMode ? 'financeiro__debug-toggle--active' : ''}`}
                onClick={() => setSalarioDebugMode((prev) => !prev)}
              >
                {salarioDebugMode ? 'Debug ligado' : 'Modo debug'}
              </button>
            </div>
          )}
          className="financeiro__card"
        >
          <div className="financeiro__summary">
            <span className="financeiro__summary-label">Total a pagar</span>
            <strong className="financeiro__summary-value">{formatCurrency(totalSalarios)}</strong>
            <span className="financeiro__summary-sub">
              Cheio: {formatCurrency(salarioDetalhado.totalCheio || 0)} · Calculado: {formatCurrency(salarioDetalhado.totalCalculado || 0)}
            </span>
          </div>

          {salarioDetalhado.montadores.length === 0 ? (
            <div className="financeiro__empty">Nenhum serviço concluído este mês</div>
          ) : (
            <div className="financeiro__accordion">
              {salarioDetalhado.montadores.map((montador) => {
                const isExpanded = expandedMontadores.has(montador.montadorId)
                return (
                  <div key={montador.montadorId} className="financeiro__accordion-item">
                    <button
                      type="button"
                      className="financeiro__accordion-header"
                      onClick={() => {
                        const next = new Set(expandedMontadores)
                        if (next.has(montador.montadorId)) {
                          next.delete(montador.montadorId)
                        } else {
                          next.add(montador.montadorId)
                        }
                        setExpandedMontadores(next)
                      }}
                    >
                      <span className="financeiro__accordion-title">
                        {isExpanded ? <MdExpandMore /> : <MdChevronRight />}
                        {montador.nome}
                      </span>
                      <span className="financeiro__accordion-value">
                        {formatCurrency(montador.totalMontador)}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="financeiro__accordion-body">
                        <div className="financeiro__table-wrapper">
                          <table className="financeiro__table">
                            <thead>
                              <tr>
                                <th>Data</th>
                                <th>Nº OS</th>
                                <th>Cliente</th>
                                <th>Valor Total</th>
                                <th>Valor calculado</th>
                                <th>Valor montador</th>
                              </tr>
                            </thead>
                            <tbody>
                              {montador.itens.map((item) => (
                                <React.Fragment key={item.assignmentKey}>
                                  <tr>
                                    <td>{formatDateOnlyPtBr(item.data)}</td>
                                    <td className="financeiro__muted">{item.numeroOS}</td>
                                    <td>{item.clienteLabel}</td>
                                    <td>{formatCurrency(item.valorCheio)}</td>
                                    <td>{formatCurrency(item.valorCalculadoCliente)}</td>
                                    <td>{formatCurrency(item.valorMontador)}</td>
                                  </tr>
                                  {salarioDebugMode && item.debug && (
                                    <tr className="financeiro__debug-row">
                                      <td colSpan={6}>
                                        <div className="financeiro__debug-line">Etapa 1: {item.debug.etapa1_fonte || '-'} | Base: {formatCurrency(Number(item.debug.etapa1_valor_base || 0))}</div>
                                        <div className="financeiro__debug-line">Etapa 2: {item.debug.etapa2_metodo || '-'} | {item.debug.etapa2_formula || '-'}</div>
                                        <div className="financeiro__debug-line">Etapa 3: {item.debug.etapa3_formula || 'Sem divisão de equipe'}</div>
                                        <div className="financeiro__debug-line">Etapa 4: {item.debug.etapa4_formula || '-'} | Final: {formatCurrency(Number(item.debug.etapa4_valor_final || 0))}</div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              ))}
                              <tr className="financeiro__table-total">
                                <td colSpan={5}>Total salário do montador</td>
                                <td>{formatCurrency(montador.totalMontador)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="financeiro__total-footer">
                <span>Total a pagar</span>
                <span className="financeiro__total-values">
                  Total: {formatCurrency(salarioDetalhado.totalCheio || 0)} · Calculado: {formatCurrency(salarioDetalhado.totalCalculado || 0)}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}

      {!isLoading && activeTab === 'pagamentos' && (
        <Card title="Pagamentos" className="financeiro__card">
          <div className="financeiro__summary">
            <span className="financeiro__summary-label">Total previsto</span>
            <strong className="financeiro__summary-value">{formatCurrency(pagamentosSummary.totalPrevisto)}</strong>
            <span className="financeiro__summary-sub">
              Pago: {formatCurrency(pagamentosSummary.totalPago)} · Saldo: {formatCurrency(pagamentosSummary.totalSaldo)}
            </span>
          </div>

          {!isMontador && (
            <div className="financeiro__section">
              <h4 className="financeiro__section-title">Sugestões por salário (OS x montador)</h4>
              <label className="financeiro__checkbox-inline">
                <input
                  type="checkbox"
                  checked={showOnlyPendingSugestoes}
                  onChange={(event) => setShowOnlyPendingSugestoes(event.target.checked)}
                />
                Somente pendentes
              </label>

              {sugestoesPagamentoHierarquiaFiltrada.length === 0 ? (
                <div className="financeiro__empty">Nenhuma sugestão do período</div>
              ) : (
                <div className="financeiro__accordion">
                  {sugestoesPagamentoHierarquiaFiltrada.map((montadorGroup) => {
                    const montadorExpanded = expandedSugestoesMontadores.has(montadorGroup.montadorId)

                    return (
                      <div key={montadorGroup.montadorId} className="financeiro__accordion-item">
                        <button
                          type="button"
                          className="financeiro__accordion-header"
                          onClick={() => {
                            const next = new Set(expandedSugestoesMontadores)
                            if (next.has(montadorGroup.montadorId)) {
                              next.delete(montadorGroup.montadorId)
                            } else {
                              next.add(montadorGroup.montadorId)
                            }
                            setExpandedSugestoesMontadores(next)
                          }}
                        >
                          <span className="financeiro__accordion-title">
                            {montadorExpanded ? <MdExpandMore /> : <MdChevronRight />}
                            {montadorGroup.montadorNome}
                          </span>
                          <span className="financeiro__accordion-value">
                            {formatCurrency(montadorGroup.totalValor)} · {montadorGroup.totalPendentes} pendente(s)
                          </span>
                        </button>

                        {montadorExpanded && (
                          <div className="financeiro__accordion-body">
                            <div className="financeiro__table-wrapper">
                              <table className="financeiro__table financeiro__table--compact">
                                <thead>
                                  <tr>
                                    <th>Loja/Cliente</th>
                                    <th>OS</th>
                                    <th>Valor</th>
                                    <th>Pendentes</th>
                                    <th>Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {montadorGroup.lojas.map((lojaGroup) => {
                                    const lojaExpanded = expandedSugestoesLojas.has(lojaGroup.lojaKey)

                                    return (
                                      <React.Fragment key={lojaGroup.lojaKey}>
                                        <tr>
                                          <td>
                                            <button
                                              type="button"
                                              className="financeiro__expand-btn"
                                              onClick={() => {
                                                const next = new Set(expandedSugestoesLojas)
                                                if (next.has(lojaGroup.lojaKey)) {
                                                  next.delete(lojaGroup.lojaKey)
                                                } else {
                                                  next.add(lojaGroup.lojaKey)
                                                }
                                                setExpandedSugestoesLojas(next)
                                              }}
                                            >
                                              {lojaExpanded ? <MdExpandMore /> : <MdChevronRight />}
                                              <strong>{lojaGroup.lojaNome}</strong>
                                            </button>
                                          </td>
                                          <td>{lojaGroup.itens.length}</td>
                                          <td>{formatCurrency(lojaGroup.totalValor)}</td>
                                          <td>{lojaGroup.totalPendentes}</td>
                                          <td>
                                            <div className="financeiro__row-actions">
                                              {lojaGroup.totalPendentes > 0 && (
                                                <button
                                                  type="button"
                                                  className="financeiro__icon-btn financeiro__icon-btn--pay"
                                                  onClick={() => handleLaunchLoteLoja(lojaGroup)}
                                                    title="Lançar OS pendentes desta loja"
                                                >
                                                    <MdEdit />
                                                </button>
                                              )}
                                                {lojaGroup.itens.some((i) => i.pagamentoExistente && i.pagamentoExistente.status !== 'pago') && (
                                                  <button
                                                    type="button"
                                                    className="financeiro__icon-btn financeiro__icon-btn--pay"
                                                    onClick={() => handleBulkBaixaFromLoja(lojaGroup)}
                                                    title="Dar baixa em lote nos lançados desta loja"
                                                  >
                                                    <MdAttachMoney />
                                                  </button>
                                                )}
                                            </div>
                                          </td>
                                        </tr>

                                        {lojaExpanded && (
                                          <tr className="financeiro__detail-row">
                                            <td colSpan={5}>
                                              <div className="financeiro__detail-box">
                                                <table className="financeiro__table financeiro__table--compact">
                                                  <thead>
                                                    <tr>
                                                      <th>OS</th>
                                                      <th>Data</th>
                                                      <th>Valor salário</th>
                                                      <th>Lançamento</th>
                                                      <th>Status pgto</th>
                                                      <th>Ação</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {lojaGroup.itens.map((sugestao) => (
                                                      <tr key={sugestao.key}>
                                                        <td className="financeiro__muted">{sugestao.numeroOS}</td>
                                                        <td>{formatDateOnlyPtBr(sugestao.dataServico)}</td>
                                                        <td>{formatCurrency(sugestao.valorSugerido)}</td>
                                                        <td>
                                                          {sugestao.pagamentoExistente ? (
                                                            <span className="financeiro__status financeiro__status--pago">Lançado</span>
                                                          ) : (
                                                            <span className="financeiro__status financeiro__status--pendente">Pendente</span>
                                                          )}
                                                        </td>
                                                        <td>
                                                          {sugestao.pagamentoExistente ? (
                                                            <span className={`financeiro__status financeiro__status--${sugestao.pagamentoExistente.status || 'pendente'}`}>
                                                              {sugestao.pagamentoExistente.status || 'pendente'}
                                                            </span>
                                                          ) : '-'}
                                                        </td>
                                                        <td>
                                                          <button
                                                            type="button"
                                                            className="financeiro__icon-btn financeiro__icon-btn--edit"
                                                            onClick={() => handleLaunchPagamentoFromSalario(sugestao)}
                                                            title={sugestao.pagamentoExistente ? 'Editar lançamento' : 'Lançar pagamento'}
                                                          >
                                                            <MdEdit />
                                                          </button>
                                                            {sugestao.pagamentoExistente && sugestao.pagamentoExistente.status !== 'pago' && (
                                                              <button
                                                                type="button"
                                                                className="financeiro__icon-btn financeiro__icon-btn--pay"
                                                                onClick={() => handleOpenBaixaModal(sugestao.pagamentoExistente)}
                                                                title="Dar baixa neste pagamento"
                                                              >
                                                                <MdAttachMoney />
                                                              </button>
                                                            )}
                                                          </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {pagamentosHierarquia.length === 0 ? (
            <div className="financeiro__empty">Nenhum pagamento lançado</div>
          ) : (
            <div className="financeiro__accordion">
              {pagamentosHierarquia.map((montadorGroup) => {
                const montadorExpanded = expandedPagamentosMontadores.has(montadorGroup.montadorId)

                return (
                  <div key={montadorGroup.montadorId} className="financeiro__accordion-item">
                    <button
                      type="button"
                      className="financeiro__accordion-header"
                      onClick={() => {
                        const next = new Set(expandedPagamentosMontadores)
                        if (next.has(montadorGroup.montadorId)) next.delete(montadorGroup.montadorId)
                        else next.add(montadorGroup.montadorId)
                        setExpandedPagamentosMontadores(next)
                      }}
                    >
                      <span className="financeiro__accordion-title">
                        {montadorExpanded ? <MdExpandMore /> : <MdChevronRight />}
                        {montadorGroup.montadorNome}
                      </span>
                      <span className="financeiro__accordion-value">
                        {formatCurrency(montadorGroup.totalPrevisto)} · {montadorGroup.totalPendentes} pendente(s)
                      </span>
                    </button>

                    {montadorExpanded && (
                      <div className="financeiro__accordion-body">
                        <div className="financeiro__table-wrapper">
                          <table className="financeiro__table financeiro__table--compact">
                            <thead>
                              <tr>
                                <th>Loja/Cliente</th>
                                <th>OS</th>
                                <th>Previsto</th>
                                <th>Pago</th>
                                <th>Saldo</th>
                                <th>Pendentes</th>
                                <th>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {montadorGroup.lojas.map((lojaGroup) => {
                                const lojaExpanded = expandedPagamentosLojas.has(lojaGroup.lojaKey)

                                return (
                                  <React.Fragment key={lojaGroup.lojaKey}>
                                    <tr>
                                      <td>
                                        <button
                                          type="button"
                                          className="financeiro__expand-btn"
                                          onClick={() => {
                                            const next = new Set(expandedPagamentosLojas)
                                            if (next.has(lojaGroup.lojaKey)) next.delete(lojaGroup.lojaKey)
                                            else next.add(lojaGroup.lojaKey)
                                            setExpandedPagamentosLojas(next)
                                          }}
                                        >
                                          {lojaExpanded ? <MdExpandMore /> : <MdChevronRight />}
                                          <strong>{lojaGroup.lojaNome}</strong>
                                        </button>
                                      </td>
                                      <td>{lojaGroup.itens.length}</td>
                                      <td>{formatCurrency(lojaGroup.totalPrevisto)}</td>
                                      <td>{formatCurrency(lojaGroup.totalPago)}</td>
                                      <td>{formatCurrency(lojaGroup.totalSaldo)}</td>
                                      <td>{lojaGroup.totalPendentes}</td>
                                      <td>
                                        <div className="financeiro__row-actions">
                                          <button
                                            type="button"
                                            className="financeiro__icon-btn"
                                            style={{ color: 'var(--color-primary)' }}
                                            title="Anexar comprovante em todos os pagamentos desta loja"
                                            onClick={() => handleOpenBulkComprovanteFromLoja(lojaGroup)}
                                          >
                                            <MdAttachFile />
                                          </button>
                                          {isAdmin && lojaGroup.totalPendentes > 0 && (
                                            <button
                                              type="button"
                                              className="financeiro__icon-btn financeiro__icon-btn--pay"
                                              title="Dar baixa em lote nesta loja"
                                              onClick={() => handleBulkBaixaFromPagamentoLoja(lojaGroup)}
                                            >
                                              <MdAttachMoney />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>

                                    {lojaExpanded && (
                                      <tr className="financeiro__detail-row">
                                        <td colSpan={7}>
                                          <div className="financeiro__detail-box">
                                            <table className="financeiro__table financeiro__table--compact">
                                              <thead>
                                                <tr>
                                                  <th>OS</th>
                                                  <th>Status</th>
                                                  <th>Previsto</th>
                                                  <th>Pago</th>
                                                  <th>Saldo</th>
                                                  <th>Últ. pagamento</th>
                                                  <th>Ações</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {lojaGroup.itens.map((item) => (
                                                  <tr key={item.id}>
                                                    <td className="financeiro__muted">{item.numeroOS}</td>
                                                    <td>
                                                      <span className={`financeiro__status financeiro__status--${item.status || 'pendente'}`}>
                                                        {item.status || 'pendente'}
                                                      </span>
                                                    </td>
                                                    <td>{formatCurrency(item.valorPrevisto)}</td>
                                                    <td>{formatCurrency(item.valorPago)}</td>
                                                    <td>{formatCurrency(item.saldo)}</td>
                                                    <td>{item.dataPagamentoLabel}</td>
                                                    <td>
                                                      <div className="financeiro__row-actions">
                                                        <button
                                                          type="button"
                                                          className="financeiro__icon-btn"
                                                          style={{ color: 'var(--color-primary)' }}
                                                          onClick={() => handleOpenComprovantes(item)}
                                                          title="Comprovantes"
                                                        >
                                                          <MdAttachFile />
                                                        </button>
                                                        {isAdmin && (
                                                          <>
                                                            <button
                                                              type="button"
                                                              className="financeiro__icon-btn financeiro__icon-btn--edit"
                                                              onClick={() => handleEditPagamento(item)}
                                                              title="Editar pagamento"
                                                            >
                                                              <MdEdit />
                                                            </button>
                                                            {item.status !== 'pago' && (
                                                              <button
                                                                type="button"
                                                                className="financeiro__icon-btn financeiro__icon-btn--pay"
                                                                onClick={() => handleOpenBaixaModal(item)}
                                                                title="Registrar baixa"
                                                              >
                                                                <MdAttachMoney />
                                                              </button>
                                                            )}
                                                            {item.status === 'pendente' && (
                                                              <button
                                                                type="button"
                                                                className="financeiro__icon-btn financeiro__icon-btn--delete"
                                                                onClick={() => handleDeletePagamento(item)}
                                                                title="Excluir pagamento"
                                                              >
                                                                <MdDelete />
                                                              </button>
                                                            )}
                                                          </>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {!isLoading && activeTab === 'recebimentos' && (
        <Card title="Recebimentos" className="financeiro__card">
          {recebimentosList.length === 0 ? (
            <div className="financeiro__empty">Nenhum serviço concluído para recebimento</div>
          ) : (
            <div className="financeiro__table-wrapper">
              <table className="financeiro__table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>OS Concluídas</th>
                    <th>Status</th>
                    <th>Total OS</th>
                    <th>Recebido</th>
                    <th>Saldo</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {recebimentosList.map((item) => (
                    <React.Fragment key={item.clienteKey}>
                      <tr>
                        <td>
                          <button
                            type="button"
                            className="financeiro__expand-btn"
                            onClick={() => {
                              const next = new Set(expandedRecebimentos)
                              if (next.has(item.clienteKey)) {
                                next.delete(item.clienteKey)
                              } else {
                                next.add(item.clienteKey)
                              }
                              setExpandedRecebimentos(next)
                            }}
                          >
                            {expandedRecebimentos.has(item.clienteKey) ? <MdExpandMore /> : <MdChevronRight />}
                            <strong>{item.clienteNome}</strong>
                          </button>
                        </td>
                        <td>{item.totalOs}</td>
                        <td>
                          <span className={`financeiro__status financeiro__status--${item.status || 'pendente'}`}>
                            {item.status || 'pendente'}
                          </span>
                        </td>
                        <td>{formatCurrency(Number(item.totalPrevisto || 0))}</td>
                        <td>{formatCurrency(Number(item.totalRecebido || 0))}</td>
                        <td>{formatCurrency(Number(item.saldo || 0))}</td>
                        <td>
                          <div className="financeiro__actions-cell">
                            <button
                              type="button"
                              className="financeiro__icon-btn financeiro__icon-btn--print"
                              onClick={() => handleOpenRecibo(item)}
                              title="Gerar recibo"
                            >
                              <MdPrint />
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                className="financeiro__icon-btn financeiro__icon-btn--edit"
                                onClick={() => handleOpenEditRecebimento(item)}
                                title="Lançar novo recebimento"
                              >
                                <MdEdit />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedRecebimentos.has(item.clienteKey) && (
                        <tr className="financeiro__detail-row">
                          <td colSpan={7}>
                            <div className="financeiro__detail-box">
                              <table className="financeiro__table financeiro__table--compact">
                                <thead>
                                  <tr>
                                    <th>OS</th>
                                    <th>Valor OS</th>
                                    <th>Recebido</th>
                                    <th>Saldo</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.detalhesOs.map((osItem) => (
                                    <tr key={osItem.servicoId}>
                                      <td className="financeiro__muted">{osItem.numeroOS}</td>
                                      <td>{formatCurrency(Number(osItem.valorTotal || 0))}</td>
                                      <td>{formatCurrency(Number(osItem.valorRecebido || 0))}</td>
                                      <td>{formatCurrency(Number(osItem.saldo || 0))}</td>
                                      <td>
                                        <span className={`financeiro__status financeiro__status--${osItem.status || 'pendente'}`}>
                                          {osItem.status || 'pendente'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!isLoading && !isMontador && activeTab === 'despesas' && (
        <Card title="Despesas" className="financeiro__card">
          {despesasList.length === 0 ? (
            <div className="financeiro__empty">Nenhuma despesa</div>
          ) : (
            <div className="financeiro__table-wrapper">
              <table className="financeiro__table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Responsável</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {despesasList.map((item) => (
                    <tr key={item.id}>
                      <td>{item.descricao}</td>
                      <td>{item.categoria || '-'}</td>
                      <td>{usuariosMap[item.responsavel_id]?.nome || '-'}</td>
                      <td>{formatCurrency(Number(item.valor || 0))}</td>
                      <td>{formatDate(item.data_despesa)}</td>
                      <td>
                        <div className="financeiro__row-actions">
                          <button
                            type="button"
                            className="financeiro__icon-btn financeiro__icon-btn--edit"
                            onClick={() => handleEditDespesa(item)}
                            title="Editar despesa"
                          >
                            <MdEdit />
                          </button>
                          <button
                            type="button"
                            className="financeiro__icon-btn financeiro__icon-btn--delete"
                            onClick={() => handleDeleteDespesa(item)}
                            title="Remover despesa"
                          >
                            <MdDelete />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {!isMontador && isDespesaModalOpen && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsDespesaModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>{editingDespesaId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => {
                  setIsDespesaModalOpen(false)
                  setEditingDespesaId(null)
                }}
              >
                ×
              </button>
            </div>

            <form className="financeiro__modal-form" onSubmit={handleDespesaSubmit}>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Categoria
                  <select
                    className="financeiro__input"
                    value={despesaForm.categoria}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      categoria: event.target.value
                    }))}
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Ferramentas">Ferramentas</option>
                    <option value="Materiais">Materiais</option>
                    <option value="Salário">Salário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </label>

                <label className="financeiro__label">
                  Valor (R$)
                  <input
                    className="financeiro__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={despesaForm.valor}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      valor: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Data
                  <input
                    className="financeiro__input"
                    type="date"
                    value={despesaForm.data_despesa}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      data_despesa: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Responsável
                  <select
                    className="financeiro__input"
                    value={despesaForm.responsavel_id}
                    onChange={(event) => setDespesaForm((prev) => ({
                      ...prev,
                      responsavel_id: event.target.value
                    }))}
                  >
                    <option value="">Nenhum</option>
                    {responsaveisDespesasList.map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="financeiro__label">
                Descrição
                <input
                  className="financeiro__input"
                  type="text"
                  placeholder="Detalhes da despesa"
                  value={despesaForm.descricao}
                  onChange={(event) => setDespesaForm((prev) => ({
                    ...prev,
                    descricao: event.target.value
                  }))}
                />
              </label>

              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => {
                    setIsDespesaModalOpen(false)
                    setEditingDespesaId(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  {editingDespesaId ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isMontador && isRecebimentoModalOpen && editingRecebimentoGrupo && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsRecebimentoModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>Lançar Recebimento - {editingRecebimentoGrupo.clienteNome}</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => {
                  setIsRecebimentoModalOpen(false)
                  setEditingRecebimentoGrupo(null)
                }}
              >
                ×
              </button>
            </div>

            <form className="financeiro__modal-form" onSubmit={handleSubmitRecebimento}>
              <p className="financeiro__muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
                Cada envio cria um novo lançamento de recebimento e preserva os anteriores.
              </p>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Status
                  <select
                    className="financeiro__input"
                    value={recebimentoForm.status}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      status: event.target.value
                    }))}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="parcial">Parcial</option>
                    <option value="recebido">Recebido</option>
                  </select>
                </label>

                {recebimentoForm.status === 'parcial' && (
                  <label className="financeiro__label">
                    Valor Parcial (R$)
                    <input
                      className="financeiro__input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={recebimentoForm.valor_parcial}
                      onChange={(event) => setRecebimentoForm((prev) => ({
                        ...prev,
                        valor_parcial: event.target.value
                      }))}
                      required
                    />
                  </label>
                )}

                <label className="financeiro__label">
                  Data Prevista
                  <input
                    className="financeiro__input"
                    type="date"
                    value={recebimentoForm.data_prevista}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      data_prevista: event.target.value
                    }))}
                  />
                </label>

                <label className="financeiro__label">
                  Data de Recebimento
                  <input
                    className="financeiro__input"
                    type="date"
                    value={recebimentoForm.data_recebimento}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      data_recebimento: event.target.value
                    }))}
                  />
                </label>

                <label className="financeiro__label">
                  Forma de Pagamento
                  <select
                    className="financeiro__input"
                    value={recebimentoForm.forma_pagamento}
                    onChange={(event) => setRecebimentoForm((prev) => ({
                      ...prev,
                      forma_pagamento: event.target.value
                    }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </label>
              </div>

              <label className="financeiro__label">
                Observações
                <textarea
                  className="financeiro__input financeiro__textarea"
                  rows={3}
                  value={recebimentoForm.observacoes}
                  onChange={(event) => setRecebimentoForm((prev) => ({
                    ...prev,
                    observacoes: event.target.value
                  }))}
                  placeholder="Detalhes do recebimento"
                />
              </label>

              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => {
                    setIsRecebimentoModalOpen(false)
                    setEditingRecebimentoGrupo(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  Lançar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isMontador && isPagamentoModalOpen && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsPagamentoModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>{editingPagamentoId ? 'Editar Pagamento' : 'Novo Pagamento'}</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => {
                  setIsPagamentoModalOpen(false)
                  setEditingPagamentoId(null)
                }}
              >
                ×
              </button>
            </div>

            <form className="financeiro__modal-form" onSubmit={handleSubmitPagamento}>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Favorecido
                  <select
                    className="financeiro__input"
                    value={pagamentoForm.usuario_id}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      usuario_id: event.target.value
                    }))}
                    required
                  >
                    <option value="">Selecione</option>
                    {(usuariosData || []).map((usuario) => (
                      <option key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="financeiro__label">
                  Serviço (OS)
                  <select
                    className="financeiro__input"
                    value={pagamentoForm.servico_id}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      servico_id: event.target.value
                    }))}
                    required
                  >
                    <option value="">Selecione</option>
                    {(servicosData || []).map((servico) => {
                      const numeroOS = servico.codigo_os_loja || servico.codigo_servico || servico.id?.slice(0, 8)
                      return (
                        <option key={servico.id} value={servico.id}>
                          {numeroOS}
                        </option>
                      )
                    })}
                  </select>
                </label>

                <label className="financeiro__label">
                  Valor previsto (R$)
                  <input
                    className="financeiro__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pagamentoForm.valor}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      valor: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Data de vencimento
                  <input
                    className="financeiro__input"
                    type="date"
                    value={pagamentoForm.data_vencimento}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      data_vencimento: event.target.value
                    }))}
                  />
                </label>

                <label className="financeiro__label">
                  Categoria
                  <select
                    className="financeiro__input"
                    value={pagamentoForm.categoria}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      categoria: event.target.value
                    }))}
                  >
                    <option value="salario">Salário</option>
                    <option value="repasse_servico">Repasse Serviço</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </label>

                <label className="financeiro__label">
                  Origem
                  <select
                    className="financeiro__input"
                    value={pagamentoForm.origem}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      origem: event.target.value
                    }))}
                  >
                    <option value="servico">Serviço</option>
                    <option value="manual">Manual</option>
                    <option value="ajuste">Ajuste</option>
                  </select>
                </label>

                <label className="financeiro__label">
                  Status
                  <select
                    className="financeiro__input"
                    value={pagamentoForm.status}
                    onChange={(event) => setPagamentoForm((prev) => ({
                      ...prev,
                      status: event.target.value
                    }))}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="parcial">Parcial</option>
                    <option value="pago">Pago</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </label>
              </div>

              <label className="financeiro__label">
                Observações
                <textarea
                  className="financeiro__input financeiro__textarea"
                  rows={3}
                  value={pagamentoForm.observacoes}
                  onChange={(event) => setPagamentoForm((prev) => ({
                    ...prev,
                    observacoes: event.target.value
                  }))}
                  placeholder="Detalhes do pagamento"
                />
              </label>

              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => {
                    setIsPagamentoModalOpen(false)
                    setEditingPagamentoId(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  {editingPagamentoId ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!isMontador && isBaixaModalOpen && baixaPagamentoContext && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsBaixaModalOpen(false)}>
          <div className="financeiro__modal" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>Registrar Baixa</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => {
                  setIsBaixaModalOpen(false)
                  setBaixaPagamentoContext(null)
                }}
              >
                ×
              </button>
            </div>

            <div className="financeiro__baixa-summary">
              <span>Favorecido: <strong>{baixaPagamentoContext.usuarioNome}</strong></span>
              <span>OS: <strong>{baixaPagamentoContext.numeroOS}</strong></span>
              <span>Saldo atual: <strong>{formatCurrency(baixaPagamentoContext.saldo)}</strong></span>
            </div>

            <form className="financeiro__modal-form" onSubmit={handleSubmitBaixa}>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Valor da baixa (R$)
                  <input
                    className="financeiro__input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={baixaForm.valor}
                    onChange={(event) => setBaixaForm((prev) => ({
                      ...prev,
                      valor: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Data de pagamento
                  <input
                    className="financeiro__input"
                    type="date"
                    value={baixaForm.data_pagamento}
                    onChange={(event) => setBaixaForm((prev) => ({
                      ...prev,
                      data_pagamento: event.target.value
                    }))}
                    required
                  />
                </label>

                <label className="financeiro__label">
                  Forma de pagamento
                  <select
                    className="financeiro__input"
                    value={baixaForm.forma_pagamento}
                    onChange={(event) => setBaixaForm((prev) => ({
                      ...prev,
                      forma_pagamento: event.target.value
                    }))}
                  >
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </label>
              </div>

              <label className="financeiro__label">
                Observações
                <textarea
                  className="financeiro__input financeiro__textarea"
                  rows={3}
                  value={baixaForm.observacoes}
                  onChange={(event) => setBaixaForm((prev) => ({
                    ...prev,
                    observacoes: event.target.value
                  }))}
                  placeholder="Ex.: adiantamento via PIX"
                />
              </label>

              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => {
                    setIsBaixaModalOpen(false)
                    setBaixaPagamentoContext(null)
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkBaixaModalOpen && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsBulkBaixaModalOpen(false)}>
          <div className="financeiro__modal" onClick={(e) => e.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>Baixa em lote — {selectedPagamentos.size} pagamento(s)</h3>
              <button type="button" className="financeiro__modal-close" onClick={() => setIsBulkBaixaModalOpen(false)}>×</button>
            </div>
            <p className="financeiro__muted" style={{ margin: '0 0 12px', fontSize: 13 }}>
              Será lançado o saldo total de cada pagamento selecionado.
            </p>
            <form className="financeiro__modal-form" onSubmit={handleSubmitBulkBaixa}>
              <div className="financeiro__form-grid">
                <label className="financeiro__label">
                  Data de pagamento
                  <input
                    className="financeiro__input"
                    type="date"
                    value={bulkBaixaForm.data_pagamento}
                    onChange={(e) => setBulkBaixaForm((prev) => ({ ...prev, data_pagamento: e.target.value }))}
                    required
                  />
                </label>
                <label className="financeiro__label">
                  Forma de pagamento
                  <input
                    className="financeiro__input"
                    type="text"
                    value={bulkBaixaForm.forma_pagamento}
                    onChange={(e) => setBulkBaixaForm((prev) => ({ ...prev, forma_pagamento: e.target.value }))}
                    placeholder="Ex.: PIX, Transferência"
                  />
                </label>
              </div>
              <label className="financeiro__label">
                Observações
                <textarea
                  className="financeiro__input"
                  rows={2}
                  value={bulkBaixaForm.observacoes}
                  onChange={(e) => setBulkBaixaForm((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Opcional"
                />
              </label>
              <div className="financeiro__modal-actions">
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={() => setIsBulkBaixaModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="financeiro__button" disabled={isBulkBaixaSubmitting}>
                  {isBulkBaixaSubmitting ? 'Processando...' : `Confirmar baixa (${selectedPagamentos.size})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {bulkComprovanteContext && (
        <div className="financeiro__modal-backdrop" onClick={() => setBulkComprovanteContext(null)}>
          <div className="financeiro__modal" onClick={(e) => e.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>Comprovante em lote</h3>
              <button type="button" className="financeiro__modal-close" onClick={() => setBulkComprovanteContext(null)}>×</button>
            </div>

            <p className="financeiro__muted" style={{ margin: '0 0 10px' }}>
              Montador: <strong>{bulkComprovanteContext.montadorNome}</strong><br />
              Loja/Cliente: <strong>{bulkComprovanteContext.lojaNome}</strong><br />
              Pagamentos selecionados: <strong>{bulkComprovanteContext.pagamentoIds.length}</strong>
            </p>

            <label className="financeiro__label" style={{ marginBottom: 10 }}>
              Descrição (opcional)
              <input
                className="financeiro__input"
                type="text"
                value={bulkComprovanteDescricao}
                onChange={(e) => setBulkComprovanteDescricao(e.target.value)}
                placeholder="Ex.: comprovante PIX loja X"
              />
            </label>

            <input
              ref={bulkFileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleUploadBulkComprovante}
            />

            <div className="financeiro__modal-actions">
              <button
                type="button"
                className="financeiro__button financeiro__button--ghost"
                onClick={() => setBulkComprovanteContext(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="financeiro__button"
                disabled={isBulkComprovanteUploading}
                onClick={() => bulkFileInputRef.current?.click()}
              >
                {isBulkComprovanteUploading ? 'Enviando...' : 'Selecionar arquivo e anexar em todos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isComprovantesModalOpen && comprovantesContext && (
        <div className="financeiro__modal-backdrop" onClick={() => setIsComprovantesModalOpen(false)}>
          <div
            className="financeiro__modal"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="financeiro__modal-header">
              <h3>Comprovantes — OS {comprovantesContext.numeroOS}</h3>
              <button
                type="button"
                className="financeiro__modal-close"
                onClick={() => setIsComprovantesModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="financeiro__baixa-summary">
              <span>Favorecido: <strong>{comprovantesContext.usuarioNome}</strong></span>
              <span>Status: <strong>{comprovantesContext.status}</strong></span>
            </div>

            <div style={{ marginTop: 16 }}>
              {comprovantesLoading && <p className="financeiro__muted">Carregando...</p>}
              {!comprovantesLoading && comprovantesData.length === 0 && (
                <p className="financeiro__muted">Nenhum comprovante anexado ainda.</p>
              )}
              {!comprovantesLoading && comprovantesData.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                  {comprovantesData.map((anexo) => (
                    <li
                      key={anexo.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 0',
                        borderBottom: '1px solid var(--color-border, #eee)'
                      }}
                    >
                      <MdAttachFile style={{ flexShrink: 0, color: 'var(--color-primary)' }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {anexo.nome_arquivo}
                      </span>
                      <span className="financeiro__muted" style={{ flexShrink: 0, fontSize: 12 }}>
                        {formatBytes(anexo.tamanho_bytes)}
                      </span>
                      <a
                        href={`${api.defaults.baseURL}/pagamentos_funcionarios/anexos/download/${comprovantesContext.id}/${encodeURIComponent(anexo.caminho_arquivo.split('/').pop())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="financeiro__icon-btn financeiro__icon-btn--edit"
                        title="Baixar"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MdDownload />
                      </a>
                      {isAdmin && (
                        <button
                          type="button"
                          className="financeiro__icon-btn financeiro__icon-btn--delete"
                          title="Remover"
                          onClick={() => handleDeleteComprovante(anexo)}
                        >
                          <MdDelete />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border, #eee)', paddingTop: 12 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14 }}>Adicionar comprovante</p>
              <label className="financeiro__label" style={{ marginBottom: 8 }}>
                Descrição (opcional)
                <input
                  className="financeiro__input"
                  type="text"
                  value={comprovantesDescricao}
                  onChange={(e) => setComprovantesDescricao(e.target.value)}
                  placeholder="Ex.: comprovante PIX"
                />
              </label>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleUploadComprovante}
              />
              <button
                type="button"
                className="financeiro__button"
                disabled={comprovantesUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MdUploadFile />
                {comprovantesUploading ? 'Enviando...' : 'Selecionar arquivo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {reciboGrupo && (
        <div className="financeiro__modal-backdrop financeiro__recibo-backdrop" onClick={handleCloseRecibo}>
          <div
            className="financeiro__modal financeiro__recibo-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="financeiro__recibo-print-area">
              <div className="financeiro__recibo-header">
                <h2 className="financeiro__recibo-title">RECIBO DE PAGAMENTO</h2>
                <p className="financeiro__recibo-date">
                  Data: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="financeiro__recibo-client">
                <span className="financeiro__recibo-label">Razão social:</span>
                <strong>{reciboRazaoSocial}</strong>
              </div>

              <label className="financeiro__checkbox-inline financeiro__recibo-config">
                <input
                  type="checkbox"
                  checked={reciboMostrarOs}
                  onChange={(event) => setReciboMostrarOs(event.target.checked)}
                />
                Exibir OS no texto do recibo
              </label>

              <p className="financeiro__recibo-texto">
                Recebi de <strong>{reciboRazaoSocial}</strong> o valor total de{' '}
                <strong>{formatCurrency(reciboValorTotal)}</strong>, referente ao serviço prestado de
                montagem de móveis e utensílios domésticos
                {reciboMostrarOs && (
                  <>
                    , vinculado{reciboOsResumo.includes(',') ? 's às OS' : ' à OS'}{' '}
                    <strong>{reciboOsResumo}</strong>
                  </>
                )}
                , nesta data de{' '}
                <strong>{new Date().toLocaleDateString('pt-BR')}</strong>.
              </p>

              <div className="financeiro__recibo-assinatura">
                <div className="financeiro__recibo-assinatura-linha">
                  <label htmlFor="recibo-assinatura-responsavel" className="financeiro__recibo-assinatura-label">
                    Assinatura do responsável
                  </label>
                  <input
                    id="recibo-assinatura-responsavel"
                    type="text"
                    className="financeiro__recibo-assinatura-input"
                    value={reciboAssinatura.assinaturaResponsavel}
                    onChange={(event) => setReciboAssinatura((prev) => ({
                      ...prev,
                      assinaturaResponsavel: event.target.value
                    }))}
                    
                  />
                </div>
                <div className="financeiro__recibo-assinatura-linha">
                  <label htmlFor="recibo-assinatura-cpf" className="financeiro__recibo-assinatura-label">
                    CPF / CNPJ
                  </label>
                  <input
                    id="recibo-assinatura-cpf"
                    type="text"
                    className="financeiro__recibo-assinatura-input"
                    value={reciboAssinatura.cpfCnpj}
                    onChange={(event) => setReciboAssinatura((prev) => ({
                      ...prev,
                      cpfCnpj: event.target.value
                    }))}
                    placeholder="Preencha aqui"
                  />
                </div>
              </div>
            </div>

            <div className="financeiro__modal-actions financeiro__recibo-actions">
              <button
                type="button"
                className="financeiro__button financeiro__button--ghost"
                onClick={handleCloseRecibo}
              >
                Fechar
              </button>
              <button
                type="button"
                className="financeiro__button"
                onClick={() => window.print()}
              >
                <MdPrint /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {dialogState.isOpen && (
        <div className="financeiro__modal-backdrop" onClick={closeDialog}>
          <div className="financeiro__modal financeiro__dialog" onClick={(event) => event.stopPropagation()}>
            <div className="financeiro__modal-header">
              <h3>{dialogState.title}</h3>
              <button type="button" className="financeiro__modal-close" onClick={closeDialog}>×</button>
            </div>

            <p className="financeiro__dialog-message">{dialogState.message}</p>

            <div className="financeiro__modal-actions">
              {dialogState.type === 'confirm' && (
                <button
                  type="button"
                  className="financeiro__button financeiro__button--ghost"
                  onClick={closeDialog}
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                className="financeiro__button"
                onClick={handleDialogConfirm}
              >
                {dialogState.type === 'confirm' ? 'Confirmar' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Financeiro
