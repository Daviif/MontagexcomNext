import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  MdAdd,
  MdClose,
  MdContentCopy,
  MdDelete,
  MdEdit,
  MdSearch
} from 'react-icons/md';
import { useApi } from '../../hooks/useApi';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import Card from '../../components/Card/Card';
import StatCard from '../../components/StatCard/StatCard';
import './Servicos.css';

const createEmptyProdutoItem = () => ({
  produto_id: '',
  quantidade: 1,
  valor_unitario: 0,
  utilizar_desconto: false,
  valor_desconto: 0
});

const createEmptyExtraItem = () => ({
  descricao: '',
  valor: 0,
  observacao: ''
});

const parseNumericValue = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatDateOnlyPtBr = (value) => {
  if (!value) return '-';

  if (typeof value === 'string') {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return `${day}/${month}/${year}`;
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
};

const Servicos = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.tipo === 'admin';

  // Data fetching
  const { data: servicos, loading: servicosLoading, refetch: refetchServicos } = useApi('/servicos');
  const { data: lojas, loading: lojasLoading } = useApi('/lojas');
  const { data: particular, loading: particularLoading } = useApi('/clientes_particulares');
  const { data: usuarios, loading: usuariosLoading } = useApi('/usuarios');
  const { data: produtos, loading: produtosLoading } = useApi('/produtos');
  const { data: servicoProdutos, loading: servicoProdutosLoading, refetch: refetchServicoProdutos } = useApi('/servico_produtos');
  const { data: servicoExtras, refetch: refetchServicoExtras } = useApi('/servico_extras');
  const { data: servicoMontadores, loading: servicoMontadoresLoading, refetch: refetchServicoMontadores } = useApi('/servico_montadores');
  const { data: equipeMembros, loading: equipeMembrosLoading } = useApi('/equipe_membros');
  const { data: rotaServicos, loading: rotaServicosLoading } = useApi('/rota_servicos');
  const { data: equipes, loading: equipesLoading } = useApi('/equipes');

  // UI State
  const [statusFilter, setStatusFilter] = useState('todos');
  const [clienteFilter, setClienteFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [anexoToDelete, setAnexoToDelete] = useState(null);
  const [notice, setNotice] = useState(null);
  const [tabProdutos, setTabProdutos] = useState([]);
  const [tabExtras, setTabExtras] = useState([]);
  const [tabMontadores, setTabMontadores] = useState([]);
  const [searchProduto, setSearchProduto] = useState('');
  const [categoriaProduto, setCategoriaProduto] = useState('');
  const [tipoAtribuicao, setTipoAtribuicao] = useState('individual'); // 'individual' ou 'equipe'
  const [equipeSelecionada, setEquipeSelecionada] = useState('');
  const [anexos, setAnexos] = useState([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const noticeTimerRef = useRef(null);
  const [formData, setFormData] = useState({
    data_servico: '',
    tipo_cliente: 'loja',
    loja_id: '',
    cliente_particular_id: '',
    endereco_rua: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado: '',
    endereco_cep: '',
    latitude: '',
    longitude: '',
    prioridade: 0,
    janela_inicio: '',
    janela_fim: '',
    observacoes: '',
    status: 'agendado',
    cliente_final_nome: '',
    cliente_final_contato: '',
    codigo_os_loja: ''
  });

  const showNotice = useCallback((type, text, duration = 4000) => {
    setNotice({ type, text });

    if (noticeTimerRef.current) {
      clearTimeout(noticeTimerRef.current);
    }

    if (duration > 0) {
      noticeTimerRef.current = setTimeout(() => {
        setNotice(null);
      }, duration);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const getProdutoSubtotal = useCallback((produto) => {
    return parseNumericValue(produto.quantidade) * parseNumericValue(produto.valor_unitario);
  }, []);

  const getProdutoDiscount = useCallback((produto) => {
    if (!produto?.utilizar_desconto) {
      return 0;
    }

    const unitario = parseNumericValue(produto.valor_unitario);
    return Math.min(Math.max(parseNumericValue(produto.valor_desconto), 0), unitario);
  }, []);

  const getProdutoTotal = useCallback((produto) => {
    const unitarioComDesconto = Math.max(parseNumericValue(produto.valor_unitario) - getProdutoDiscount(produto), 0);
    const total = parseNumericValue(produto.quantidade) * unitarioComDesconto;
    return Number(total.toFixed(2));
  }, [getProdutoDiscount]);

  // Memoized maps for fast lookups
  const lojasById = useMemo(() => {
    const map = {};
    if (lojas) {
      lojas.forEach(l => {
        map[l.id] = l;
      });
    }
    return map;
  }, [lojas]);

  const particularById = useMemo(() => {
    const map = {};
    if (particular) {
      particular.forEach(p => {
        map[p.id] = p;
      });
    }
    return map;
  }, [particular]);

  const usuariosById = useMemo(() => {
    const map = {};
    if (usuarios) {
      usuarios.forEach(u => {
        map[u.id] = u;
      });
    }
    return map;
  }, [usuarios]);

  const produtosById = useMemo(() => {
    const map = {};
    if (produtos) {
      produtos.forEach(p => {
        map[p.id] = p;
      });
    }
    return map;
  }, [produtos]);

  const equipeMembrosByEquipeId = useMemo(() => {
    const map = {};
    if (equipeMembros) {
      equipeMembros.forEach((membro) => {
        if (!membro?.equipe_id || !membro?.usuario_id) return;
        if (!map[membro.equipe_id]) {
          map[membro.equipe_id] = [];
        }
        map[membro.equipe_id].push(membro.usuario_id);
      });
    }
    return map;
  }, [equipeMembros]);

  const buildEquipeMontadores = useCallback((equipeId, existingRows = []) => {
    if (!equipeId) return [];

    const usuariosEquipe = Array.from(new Set(equipeMembrosByEquipeId[equipeId] || []));
    const existingByUsuarioId = (existingRows || []).reduce((acc, item) => {
      if (item?.usuario_id) {
        acc[item.usuario_id] = item;
      }
      return acc;
    }, {});

    return usuariosEquipe.map((usuarioId) => {
      const usuario = usuariosById[usuarioId];
      const existing = existingByUsuarioId[usuarioId];
      const percentual = existing?.percentual_divisao != null
        ? Number(existing.percentual_divisao)
        : Math.min(Math.max(Number(usuario?.percentual_salario ?? 50), 0), 100);

      return {
        equipe_id: equipeId,
        usuario_id: usuarioId,
        percentual_divisao: Number(percentual.toFixed(2)),
        valor_atribuido: 0,
        papel: existing?.papel || 'principal'
      };
    });
  }, [equipeMembrosByEquipeId, usuariosById]);

  // Map de serviços associados em rotas (para permitir/impedir deletar)
  const servicoRotasCount = useMemo(() => {
    const map = {};
    if (rotaServicos) {
      rotaServicos.forEach(rs => {
        if (!map[rs.servico_id]) {
          map[rs.servico_id] = [];
        }
        map[rs.servico_id].push(rs);
      });
    }
    return map;
  }, [rotaServicos]);

  // Filter servicos by status
  const filteredServicos = useMemo(() => {
    if (!servicos) return [];
    return servicos.filter(s => {
      const matchStatus = statusFilter === 'todos' || s.status === statusFilter;
      const matchCliente = clienteFilter === 'todos' || s.tipo_cliente === clienteFilter;
      const matchSearch = searchTerm === '' || 
        s.codigo_os_loja?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo_servico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.endereco_execucao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.observacoes?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchCliente && matchSearch;
    });
  }, [servicos, statusFilter, clienteFilter, searchTerm]);

  // Produtos da loja filtrados (ou todos se particular)
  const produtosFilterados = useMemo(() => {
    if (!produtos) return [];
    
    // Se for particular, mostrar todos os produtos
    if (formData.tipo_cliente === 'particular') {
      return produtos.filter(p => {
        const matchCategoria = categoriaProduto === '' || (p.categoria && p.categoria.toLowerCase() === categoriaProduto.toLowerCase());
        const matchSearch = searchProduto === '' || p.nome.toLowerCase().includes(searchProduto.toLowerCase());
        return matchCategoria && matchSearch;
      });
    }
    
    // Se for loja, filtrar por loja_id
    if (!formData.loja_id) return [];
    
    return produtos.filter(p => {
      const matchLoja = p.loja_id === formData.loja_id;
      const matchCategoria = categoriaProduto === '' || (p.categoria && p.categoria.toLowerCase() === categoriaProduto.toLowerCase());
      const matchSearch = searchProduto === '' || p.nome.toLowerCase().includes(searchProduto.toLowerCase());
      
      return matchLoja && matchCategoria && matchSearch;
    });
  }, [produtos, formData.loja_id, formData.tipo_cliente, categoriaProduto, searchProduto]);

  // Categorias únicas (de todos os produtos se particular, ou só da loja se loja)
  const categoriasLoja = useMemo(() => {
    if (!produtos) return [];
    
    const cats = new Set();
    let relevantProducts = [];
    
    if (formData.tipo_cliente === 'particular') {
      relevantProducts = produtos;
    } else if (formData.loja_id) {
      relevantProducts = produtos.filter(p => p.loja_id === formData.loja_id);
    }
    
    relevantProducts.forEach(p => {
      if (p.categoria) cats.add(p.categoria);
    });
    
    return Array.from(cats).sort();
  }, [produtos, formData.loja_id, formData.tipo_cliente]);

  // Stats
  const stats = useMemo(() => {
    if (!servicos) return { total: 0, agendado: 0, em_rota: 0, concluido: 0, cancelado: 0 };
    return {
      total: servicos.length,
      agendado: servicos.filter(s => s.status === 'agendado').length,
      em_rota: servicos.filter(s => s.status === 'em_rota').length,
      concluido: servicos.filter(s => s.status === 'concluido').length,
      cancelado: servicos.filter(s => s.status === 'cancelado').length
    };
  }, [servicos]);

  // Get cliente info
  const getClienteInfo = useCallback((servico) => {
    if (servico.tipo_cliente === 'loja' && servico.loja_id) {
      const loja = lojasById[servico.loja_id];
      return {
        nome: loja?.nome || loja?.nome_fantasia || loja?.razao_social || 'Sem nome',
        cpf_cnpj: loja?.cnpj || '-'
      };
    } else if (servico.tipo_cliente === 'particular' && servico.cliente_particular_id) {
      const part = particularById[servico.cliente_particular_id];
      return {
        nome: part?.nome || 'Sem nome',
        cpf_cnpj: part?.cpf || '-'
      };
    }
    return { nome: 'Cliente não encontrado', cpf_cnpj: '-' };
  }, [lojasById, particularById]);

  // Get servico produtos
  const getServicoProdutos = useCallback((servicoId) => {
    if (!servicoProdutos) return [];
    return servicoProdutos.filter(sp => sp.servico_id === servicoId);
  }, [servicoProdutos]);

  // Get servico montadores
  const getServicoMontadores = useCallback((servicoId) => {
    if (!servicoMontadores) return [];
    return servicoMontadores.filter(sm => sm.servico_id === servicoId);
  }, [servicoMontadores]);

  // Get servico extras
  const getServicoExtras = useCallback((servicoId) => {
    if (!servicoExtras) return [];
    return servicoExtras.filter(se => se.servico_id === servicoId);
  }, [servicoExtras]);

  // Open edit modal
  const handleEdit = useCallback((servico) => {
    const enderecoParts = (servico.endereco_execucao || '').split(',').map(part => part.trim());
    const hasBairro = enderecoParts.length >= 6;
    setFormData({
      data_servico: servico.data_servico || '',
      tipo_cliente: servico.tipo_cliente || 'loja',
      loja_id: servico.loja_id || '',
      cliente_particular_id: servico.cliente_particular_id || '',
      endereco_rua: enderecoParts[0] || servico.endereco_execucao || '',
      endereco_numero: enderecoParts[1] || '',
      endereco_bairro: hasBairro ? (enderecoParts[2] || '') : '',
      endereco_cidade: hasBairro ? (enderecoParts[3] || '') : (enderecoParts[2] || ''),
      endereco_estado: hasBairro ? (enderecoParts[4] || '') : (enderecoParts[3] || ''),
      endereco_cep: hasBairro ? (enderecoParts[5] || '') : (enderecoParts[4] || ''),
      latitude: servico.latitude || '',
      longitude: servico.longitude || '',
      prioridade: servico.prioridade || 0,
      janela_inicio: servico.janela_inicio || '',
      janela_fim: servico.janela_fim || '',
      observacoes: servico.observacoes || '',
      status: servico.status || 'agendado',
      cliente_final_nome: servico.cliente_final_nome || '',
      cliente_final_contato: servico.cliente_final_contato || '',
      codigo_os_loja: servico.codigo_os_loja || ''
    });
    
    const montadores = getServicoMontadores(servico.id);
    setTabProdutos(
      getServicoProdutos(servico.id).map((item) => {
        const valorDesconto = parseNumericValue(item.valor_desconto);

        return {
          ...item,
          quantidade: parseNumericValue(item.quantidade) || 1,
          valor_unitario: parseNumericValue(item.valor_unitario),
          utilizar_desconto: item.utilizar_desconto != null
            ? Boolean(item.utilizar_desconto)
            : valorDesconto > 0,
          valor_desconto: valorDesconto
        };
      })
    );
    setTabMontadores(montadores);
    setTabExtras(
      getServicoExtras(servico.id).map(item => ({
        ...item,
        valor: parseNumericValue(item.valor)
      }))
    );
    
    // Detectar tipo de atribuição
    if (montadores && montadores.length > 0) {
      const temEquipe = montadores.some(m => m.equipe_id);
      const temIndividual = montadores.some(m => m.usuario_id && !m.equipe_id);
      
      if (temEquipe) {
        const equipeId = montadores.find(m => m.equipe_id)?.equipe_id || '';
        setTipoAtribuicao('equipe');
        setEquipeSelecionada(equipeId);
        setTabMontadores(buildEquipeMontadores(equipeId, montadores));
      } else if (temIndividual) {
        setTipoAtribuicao('individual');
        setEquipeSelecionada('');
      }
    }
    
    setEditingId(servico.id);
    carregarAnexos(servico.id);
    setShowModal(true);
  }, [buildEquipeMontadores, getServicoProdutos, getServicoMontadores, getServicoExtras]);

  // Duplicate existing service into a new draft
  const handleDuplicate = useCallback((servico) => {
    const enderecoParts = (servico.endereco_execucao || '').split(',').map(part => part.trim());
    const hasBairro = enderecoParts.length >= 6;

    setFormData({
      data_servico: servico.data_servico || '',
      tipo_cliente: servico.tipo_cliente || 'loja',
      loja_id: servico.loja_id || '',
      cliente_particular_id: servico.cliente_particular_id || '',
      endereco_rua: enderecoParts[0] || servico.endereco_execucao || '',
      endereco_numero: enderecoParts[1] || '',
      endereco_bairro: hasBairro ? (enderecoParts[2] || '') : '',
      endereco_cidade: hasBairro ? (enderecoParts[3] || '') : (enderecoParts[2] || ''),
      endereco_estado: hasBairro ? (enderecoParts[4] || '') : (enderecoParts[3] || ''),
      endereco_cep: hasBairro ? (enderecoParts[5] || '') : (enderecoParts[4] || ''),
      latitude: servico.latitude || '',
      longitude: servico.longitude || '',
      prioridade: servico.prioridade || 0,
      janela_inicio: servico.janela_inicio || '',
      janela_fim: servico.janela_fim || '',
      observacoes: servico.observacoes || '',
      status: 'agendado',
      cliente_final_nome: servico.cliente_final_nome || '',
      cliente_final_contato: servico.cliente_final_contato || '',
      codigo_os_loja: servico.codigo_os_loja || ''
    });

    const montadores = getServicoMontadores(servico.id);
    setTabProdutos(
      getServicoProdutos(servico.id).map((item) => {
        const valorDesconto = parseNumericValue(item.valor_desconto);

        return {
          ...item,
          quantidade: parseNumericValue(item.quantidade) || 1,
          valor_unitario: parseNumericValue(item.valor_unitario),
          utilizar_desconto: item.utilizar_desconto != null
            ? Boolean(item.utilizar_desconto)
            : valorDesconto > 0,
          valor_desconto: valorDesconto
        };
      })
    );
    setTabMontadores(montadores);

    if (montadores && montadores.length > 0) {
      const temEquipe = montadores.some(m => m.equipe_id);
      const temIndividual = montadores.some(m => m.usuario_id && !m.equipe_id);

      if (temEquipe) {
        const equipeId = montadores.find(m => m.equipe_id)?.equipe_id || '';
        setTipoAtribuicao('equipe');
        setEquipeSelecionada(equipeId);
        setTabMontadores(buildEquipeMontadores(equipeId, montadores));
      } else if (temIndividual) {
        setTipoAtribuicao('individual');
        setEquipeSelecionada('');
      }
    } else {
      setTipoAtribuicao('individual');
      setEquipeSelecionada('');
    }

    setAnexos([]);
    setEditingId(null);
    setTabExtras(
      getServicoExtras(servico.id).map(item => ({
        ...item,
        valor: parseNumericValue(item.valor)
      }))
    );
    setShowModal(true);
    showNotice('success', 'Serviço duplicado. Revise os dados e salve para criar a nova OS.');
  }, [buildEquipeMontadores, getServicoMontadores, getServicoProdutos, getServicoExtras, showNotice]);

  // Create new
  const handleNew = useCallback(() => {
    setFormData({
      data_servico: '',
      tipo_cliente: 'loja',
      loja_id: '',
      cliente_particular_id: '',
      endereco_rua: '',
      endereco_numero: '',
      endereco_bairro: '',
      endereco_cidade: '',
      endereco_estado: '',
      endereco_cep: '',
      latitude: '',
      longitude: '',
      prioridade: 0,
      janela_inicio: '',
      janela_fim: '',
      observacoes: '',
      status: 'agendado',
      cliente_final_nome: '',
      cliente_final_contato: '',
      codigo_os_loja: ''
    });
    setTabProdutos([]);
    setTabExtras([]);
    setTabMontadores([]);
    setTipoAtribuicao('individual');
    setEquipeSelecionada('');
    setEditingId(null);
    setShowModal(true);
  }, []);

  // Geocodificar endereço
  const geocodeAddress = useCallback(async (address, options = {}) => {
    const { showFeedback = false } = options;
    if (!address || address.trim().length < 5) {
      console.log('Endereço muito curto para geocodificação:', address);
      return;
    }
    
    console.log('🌍 Buscando coordenadas para:', address);
    
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      console.log('📡 URL da API:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📥 Resposta da API:', data);
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const latitude = parseFloat(lat).toFixed(6);
        const longitude = parseFloat(lon).toFixed(6);
        
        console.log('✅ Coordenadas encontradas:', { latitude, longitude });
        
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        
        if (showFeedback) {
          showNotice('success', `Coordenadas encontradas: latitude ${latitude} e longitude ${longitude}.`);
        }
      } else {
        console.warn('⚠️ Nenhuma coordenada encontrada para o endereço');
        if (showFeedback) {
          showNotice('warning', 'Não foi possível encontrar as coordenadas para este endereço. Verifique os dados.');
        }
      }
    } catch (err) {
      console.error('❌ Erro ao geocodificar endereço:', err);
      if (showFeedback) {
        showNotice('error', 'Erro ao buscar coordenadas. Verifique sua conexão com a internet.');
      }
    }
  }, [showNotice]);

  const buildEnderecoExecucao = useCallback((data, options = {}) => {
    const { includeBairro = true } = options;

    const parts = [
      data.endereco_rua,
      data.endereco_numero,
      ...(includeBairro ? [data.endereco_bairro] : []),
      data.endereco_cidade,
      data.endereco_estado,
      data.endereco_cep
    ].filter(Boolean);

    return parts.join(', ');
  }, []);

  const handleEnderecoBlur = useCallback((field, value) => {
    geocodeAddress(buildEnderecoExecucao({
      ...formData,
      [field]: value
    }));
  }, [buildEnderecoExecucao, formData, geocodeAddress]);

  // Formatar telefone
  const formatTelefone = useCallback((value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) {
      return cleaned;
    }
    if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    }
    if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
    }
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  }, []);

  // Preencher dados do cliente particular automaticamente
  const handleClienteParticularSelect = useCallback((clienteId) => {
    if (!clienteId) return;
    
    const cliente = particularById[clienteId];
    if (!cliente) return;

    // Parse endereço existente (formato: "Rua, Número, Complemento, Bairro, Cidade, Estado, CEP")
    const enderecoParts = (cliente.endereco || '').split(',').map(part => part.trim());
    const hasBairro = enderecoParts.length >= 7;

    const novosDados = {
      cliente_particular_id: clienteId,
      cliente_final_nome: cliente.nome || '',
      cliente_final_contato: cliente.telefone || '',
      endereco_rua: enderecoParts[0] || '',
      endereco_numero: enderecoParts[1] || '',
      endereco_complemento: enderecoParts[2] || '',
      endereco_bairro: hasBairro ? (enderecoParts[3] || '') : '',
      endereco_cidade: hasBairro ? (enderecoParts[4] || '') : (enderecoParts[3] || ''),
      endereco_estado: hasBairro ? (enderecoParts[5] || '') : (enderecoParts[4] || ''),
      endereco_cep: hasBairro ? (enderecoParts[6] || '') : (enderecoParts[5] || '')
    };

    setFormData(prev => ({
      ...prev,
      ...novosDados
    }));

    // Geocodificar endereço automaticamente se tiver dados suficientes
    if (novosDados.endereco_rua && novosDados.endereco_cidade) {
      const enderecoCompleto = [
        novosDados.endereco_rua,
        novosDados.endereco_numero,
        novosDados.endereco_bairro,
        novosDados.endereco_cidade,
        novosDados.endereco_estado,
        novosDados.endereco_cep
      ].filter(Boolean).join(', ');
      
      geocodeAddress(enderecoCompleto);
    }
  }, [particularById, geocodeAddress]);

  // Lidar com mudança de tipo de cliente
  const handleTipoClienteChange = useCallback((novoTipo) => {
    setFormData(prev => ({
      ...prev,
      tipo_cliente: novoTipo,
      loja_id: '',
      cliente_particular_id: '',
      // Limpar campos específicos quando mudar de tipo
      ...(novoTipo === 'particular' ? { codigo_os_loja: '' } : {})
    }));
  }, []);

  // Auto-geocodificar quando campos de endereço mudam
  useEffect(() => {
    if (!showModal) return; // Só fazer geocodificação quando modal está aberto
    
    // Criar um timer para evitar fazer geocodificação a cada keystroke
    const timer = setTimeout(() => {
      if (formData.endereco_rua && formData.endereco_cidade) {
        const enderecoCompleto = buildEnderecoExecucao(formData);
        if (enderecoCompleto && enderecoCompleto.trim().length >= 5) {
          geocodeAddress(enderecoCompleto);
        }
      }
    }, 1000); // Aguardar 1 segundo após parar de digitar

    return () => clearTimeout(timer);
  }, [
    formData.endereco_rua,
    formData.endereco_numero,
    formData.endereco_bairro,
    formData.endereco_cidade,
    formData.endereco_estado,
    formData.endereco_cep,
    showModal,
    buildEnderecoExecucao,
    geocodeAddress
  ]);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const totalProdutos = tabProdutos.reduce(
        (acc, produto) => acc + getProdutoTotal(produto),
        0
      );
      const totalExtras = tabExtras.reduce(
        (acc, extra) => acc + parseNumericValue(extra.valor),
        0
      );
      const totalGeral = totalProdutos + totalExtras;
      const lojaSelecionada = formData.tipo_cliente === 'loja' ? lojasById[formData.loja_id] : null;
      const repasseBase = lojaSelecionada?.usa_porcentagem
        && lojaSelecionada?.porcentagem_repasse != null
        && Number(lojaSelecionada.porcentagem_repasse) > 0
        ? (totalProdutos * Number(lojaSelecionada.porcentagem_repasse)) / 100
        : totalProdutos;

          const dataToSend = {
            data_servico: formData.data_servico,
            tipo_cliente: formData.tipo_cliente,
            loja_id: formData.tipo_cliente === 'loja' ? formData.loja_id || null : null,
            cliente_particular_id: formData.tipo_cliente === 'particular' ? formData.cliente_particular_id || null : null,
            endereco_execucao: buildEnderecoExecucao(formData, { includeBairro: false }),
            latitude: formData.latitude || null,
            longitude: formData.longitude || null,
        valor_total: Number(totalGeral.toFixed(2)),
        valor_repasse_montagem: Number(repasseBase.toFixed(2)),
            prioridade: formData.prioridade || 0,
            janela_inicio: formData.janela_inicio || null,
            janela_fim: formData.janela_fim || null,
            observacoes: formData.observacoes || null,
            status: formData.status,
            cliente_final_nome: formData.tipo_cliente === 'loja' ? formData.cliente_final_nome || null : null,
            cliente_final_contato: formData.tipo_cliente === 'loja' ? formData.cliente_final_contato || null : null,
            codigo_os_loja: formData.tipo_cliente === 'loja' ? formData.codigo_os_loja || null : null
          };

      const servicoResponse = editingId
        ? await api.put(`/servicos/${editingId}`, dataToSend)
        : await api.post('/servicos', dataToSend);

      const servicoId = editingId || servicoResponse.data?.id;

      if (servicoId) {
        const existingProdutos = await api.get(`/servico_produtos?servico_id=${servicoId}`);
        await Promise.all(
          (existingProdutos.data || []).map((item) => api.delete(`/servico_produtos/${item.id}`))
        );

        const produtosPayload = tabProdutos
          .filter((produto) => produto.produto_id)
          .map((produto) => ({
            servico_id: servicoId,
            produto_id: produto.produto_id,
            quantidade: Number(produto.quantidade || 1),
            valor_unitario: Number(produto.valor_unitario || 0),
            utilizar_desconto: Boolean(produto.utilizar_desconto),
            valor_desconto: getProdutoDiscount(produto),
            valor_total: getProdutoTotal(produto)
          }));

        if (produtosPayload.length > 0) {
          await Promise.all(produtosPayload.map((payload) => api.post('/servico_produtos', payload)));
        }

        const existingMontadores = await api.get(`/servico_montadores?servico_id=${servicoId}`);
        await Promise.all(
          (existingMontadores.data || []).map((item) => api.delete(`/servico_montadores/${item.id}`))
        );

        // Filtrar montadores válidos
        let montadoresPayload = [];
        
        if (tipoAtribuicao === 'individual') {
          // Atribuição individual
          const montadoresValidos = tabMontadores.filter((montador) => montador.usuario_id);
          
          // Remover duplicatas baseado em usuario_id
          const montadoresUnicos = montadoresValidos.reduce((acc, montador) => {
            if (!acc.find(m => m.usuario_id === montador.usuario_id)) {
              acc.push(montador);
            }
            return acc;
          }, []);
          
          const totalPercentual = montadoresUnicos.reduce(
            (acc, montador) => acc + Number(montador.percentual_divisao || 0),
            0
          );
          const valorPorMontador = montadoresUnicos.length > 0
            ? Number((totalProdutos / montadoresUnicos.length).toFixed(2))
            : 0;

          montadoresPayload = montadoresUnicos.map((montador) => {
            const percentual = Number(montador.percentual_divisao || 0);
            const valorCalculado = percentual > 0
              ? (totalProdutos * percentual) / 100
              : valorPorMontador;
            const valorManual = Number(montador.valor_atribuido || 0);
            const valorFinal = valorManual > 0 ? valorManual : valorCalculado;

            return {
              servico_id: servicoId,
              usuario_id: montador.usuario_id,
              valor_atribuido: Number(valorFinal.toFixed(2)),
              papel: montador.papel || 'principal',
              percentual_divisao: percentual > 0 ? percentual : null
            };
          });
        } else if (tipoAtribuicao === 'equipe') {
          const montadoresEquipe = tabMontadores
            .filter((montador) => montador.usuario_id && montador.equipe_id)
            .map((montador) => {
              const percentual = Math.min(Math.max(Number(montador.percentual_divisao || 0), 0), 100);
              return {
                ...montador,
                percentual_divisao: percentual
              };
            });

          if (montadoresEquipe.length === 0) {
            throw new Error('Selecione uma equipe com montadores válidos.');
          }

          montadoresPayload = montadoresEquipe.map((montador) => {
            // Aplicar percentual_divisao ao valor TOTAL (250), não ao repasseBase
            const valorAtribuido = (totalProdutos * montador.percentual_divisao) / 100;
            console.log('🔵 SERVICOS.JSX - Equipe:', {
              totalProdutos,
              percentual_divisao: montador.percentual_divisao,
              calculo: `${totalProdutos} * ${montador.percentual_divisao} / 100`,
              valorAtribuido: Number(valorAtribuido.toFixed(2))
            });
            return {
              servico_id: servicoId,
              equipe_id: montador.equipe_id,
              usuario_id: montador.usuario_id,
              valor_atribuido: Number(valorAtribuido.toFixed(2)),
              papel: montador.papel || 'principal',
              percentual_divisao: Number(montador.percentual_divisao || 0)
            };
          });
        }

        if (montadoresPayload.length > 0) {
          await Promise.all(montadoresPayload.map((payload) => api.post('/servico_montadores', payload)));
        }

        // Salvar extras
        const existingExtras = await api.get(`/servico_extras?servico_id=${servicoId}`);
        await Promise.all(
          (existingExtras.data || []).map((item) => api.delete(`/servico_extras/${item.id}`))
        );

        const extrasPayload = tabExtras
          .filter(extra => extra.descricao && extra.descricao.trim())
          .map(extra => ({
            servico_id: servicoId,
            descricao: extra.descricao.trim(),
            valor: Number(extra.valor || 0),
            observacao: extra.observacao || null
          }));

        if (extrasPayload.length > 0) {
          await Promise.all(extrasPayload.map(payload => api.post('/servico_extras', payload)));
        }
      }

      setShowModal(false);
      refetchServicos();
      refetchServicoProdutos();
      refetchServicoMontadores();
      refetchServicoExtras();
      showNotice('success', editingId ? 'Serviço atualizado com sucesso.' : 'Serviço criado com sucesso.');
    } catch (err) {
      showNotice('error', 'Erro ao salvar serviço: ' + err.message);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!isAdmin) return;
    try {
      setDeleteError(null);
      await api.delete(`/servicos/${showDeleteConfirm}`);
      setShowDeleteConfirm(null);
      refetchServicos();
      showNotice('success', 'Serviço deletado com sucesso.');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.hasRotas) {
        setDeleteError({
          title: errorData.error,
          message: errorData.message,
          rotas: errorData.rotasCount
        });
      } else {
        setDeleteError({
          title: 'Erro ao deletar',
          message: err.message
        });
      }
    }
  };

  // Add produto
  const handleAddProduto = () => {
    setTabProdutos([...tabProdutos, createEmptyProdutoItem()]);
  };

  // Remove produto
  const handleRemoveProduto = (idx) => {
    setTabProdutos(tabProdutos.filter((_, i) => i !== idx));
  };

  // Update produto
  const handleUpdateProduto = (idx, field, value) => {
    const updated = [...tabProdutos];

    updated[idx] = {
      ...updated[idx],
      [field]: field === 'valor_desconto' ? Math.max(parseNumericValue(value), 0) : value
    };

    if (field === 'produto_id') {
      const prod = produtosById[value];
      if (prod) {
        updated[idx].valor_unitario = parseNumericValue(prod.valor_base);
      }

      updated[idx].utilizar_desconto = false;
      updated[idx].valor_desconto = 0;
    }

    if (field === 'quantidade') {
      updated[idx].quantidade = Math.max(parseNumericValue(value), 1);
    }

    if (field === 'utilizar_desconto' && !value) {
      updated[idx].valor_desconto = 0;
    }

    setTabProdutos(updated);
  };

  // Add montador
  const handleAddMontador = () => {
    setTabMontadores([...tabMontadores, { usuario_id: '', valor_atribuido: 0, papel: 'principal' }]);
  };

  // Remove montador
  const handleRemoveMontador = (idx) => {
    setTabMontadores(tabMontadores.filter((_, i) => i !== idx));
  };

  // Update montador
  const handleUpdateMontador = (idx, field, value) => {
    const updated = [...tabMontadores];
    updated[idx][field] = value;
    setTabMontadores(updated);
  };

  // Add extra
  const handleAddExtra = () => {
    setTabExtras([...tabExtras, createEmptyExtraItem()]);
  };

  // Remove extra
  const handleRemoveExtra = (idx) => {
    setTabExtras(tabExtras.filter((_, i) => i !== idx));
  };

  // Update extra
  const handleUpdateExtra = (idx, field, value) => {
    const updated = [...tabExtras];
    updated[idx] = { ...updated[idx], [field]: value };
    setTabExtras(updated);
  };

  // Anexos
  const carregarAnexos = useCallback((servicoId) => {
    api.get(`/anexos/servicos/${servicoId}/anexos`)
      .then(res => setAnexos(res.data || []))
      .catch(err => console.error('Erro ao carregar anexos:', err));
  }, []);

  const handleUploadAnexo = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingId) return;

    setUploadingAnexo(true);
    const formData = new FormData();
    formData.append('arquivo', files[0]);
    formData.append('descricao', '');

    try {
      await api.post(`/anexos/servicos/${editingId}/anexos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      carregarAnexos(editingId);
      e.target.value = '';
      showNotice('success', 'Anexo enviado com sucesso.');
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      showNotice('error', 'Erro ao fazer upload: ' + err.message);
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleRemoveAnexo = async (anexoId) => {
    try {
      await api.delete(`/anexos/anexos/${anexoId}`);
      setAnexos(anexos.filter(a => a.id !== anexoId));
      setAnexoToDelete(null);
      showNotice('success', 'Anexo removido com sucesso.');
    } catch (err) {
      showNotice('error', 'Erro ao remover anexo: ' + err.message);
    }
  };

  const handleDownloadAnexo = (anexo) => {
    const link = document.createElement('a');
    link.href = anexo.caminho_arquivo;
    link.download = anexo.nome_arquivo;
    link.click();
  };

  const loading = servicosLoading || lojasLoading || particularLoading || usuariosLoading || 
                  produtosLoading || servicoProdutosLoading || servicoMontadoresLoading || equipeMembrosLoading;

  if (loading) return <div className="servicos-container"><p>Carregando...</p></div>;

  return (
    <div className="servicos">
      {/* Header */}
      <div className="servicos__header">
        <div>
          <h1 className="servicos__title">Serviços</h1>
          <p className="servicos__subtitle">Gerencie todos os agendamentos</p>
        </div>
        <div className="servicos__actions">
          {isAdmin && (
            <button onClick={handleNew} className="servicos__button">
              <MdAdd /> Novo Serviço
            </button>
          )}
        </div>
      </div>

      {notice && (
        <div className={`servicos__notice servicos__notice--${notice.type}`}>
          {notice.text}
        </div>
      )}

      {/* Stats */}
      <div className="servicos__stats">
        <StatCard title="Total" value={stats.total} icon="📊" />
        <StatCard title="Agendado" value={stats.agendado} icon="📅" color="#3498db" />
        <StatCard title="Em Rota" value={stats.em_rota} icon="🚚" color="#f39c12" />
        <StatCard title="Concluído" value={stats.concluido} icon="✅" color="#27ae60" />
        <StatCard title="Cancelado" value={stats.cancelado} icon="❌" color="#e74c3c" />
      </div>

      {/* Card Principal */}
      <Card title="Gerenciamento de Serviços">
        {/* Toolbar */}
        <div className="servicos__toolbar">
          <div className="servicos__search">
            <MdSearch className="servicos__search-icon" />
            <input
              type="text"
              placeholder="Buscar por endereço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="servicos__search-input"
            />
          </div>
          <select
            className="servicos__filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="agendado">Agendado</option>
            <option value="em_rota">Em Rota</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select
            className="servicos__filter-select"
            value={clienteFilter}
            onChange={(e) => setClienteFilter(e.target.value)}
          >
            <option value="todos">Todos os clientes</option>
            <option value="loja">Lojas</option>
            <option value="particular">Particulares</option>
          </select>
        </div>

        {filteredServicos.length === 0 ? (
          <div className="servicos__empty-state">
            <div className="servicos__empty-icon">📄</div>
            <h3>Nenhum serviço encontrado</h3>
            <p>Comece adicionando um novo serviço</p>
          </div>
        ) : (
          <div className="servicos__table-wrapper">
            <table className="servicos__table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Nº OS</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Endereço</th>
                  <th>Produtos</th>
                  <th>Montadores</th>
                  <th>Janela</th>
                  <th>Prioridade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredServicos.map(servico => {
                  const clienteInfo = getClienteInfo(servico);
                  const prods = getServicoProdutos(servico.id);
                  const mts = getServicoMontadores(servico.id);
                  return (
                    <tr key={servico.id}>
                      <td>{formatDateOnlyPtBr(servico.data_servico)}</td>
                      <td className="servicos__small-text">{servico.codigo_os_loja || servico.codigo_servico || '-'}</td>
                      <td>
                        <strong>{clienteInfo.nome}</strong>
                        <div className="servicos__small-text">{clienteInfo.cpf_cnpj}</div>
                      </td>
                      <td><span className="servicos__badge">{servico.tipo_cliente}</span></td>
                      <td className="servicos__endereco-cell">{servico.endereco_execucao}</td>
                      <td className="servicos__text-center">
                        <span className="servicos__count-badge">{prods.length}</span>
                      </td>
                      <td className="servicos__text-center">
                        <span className="servicos__count-badge">{mts.length}</span>
                      </td>
                      <td className="servicos__small-text">
                        {servico.janela_inicio || '-'}
                        {servico.janela_fim && ` até ${servico.janela_fim}`}
                      </td>
                      <td className="servicos__text-center">
                        <span className={`servicos__priority-${servico.prioridade}`}>
                          {servico.prioridade}
                        </span>
                      </td>
                      <td className="servicos__actions-cell">
                        {isAdmin && (
                          <>
                            <button
                              className="servicos__action-btn servicos__action-btn--edit"
                              onClick={() => handleEdit(servico)}
                              title="Editar"
                            >
                              <MdEdit />
                            </button>
                            <button
                              className="servicos__action-btn servicos__action-btn--duplicate"
                              onClick={() => handleDuplicate(servico)}
                              title="Duplicar"
                            >
                              <MdContentCopy />
                            </button>
                            <button
                              className="servicos__action-btn servicos__action-btn--delete"
                              onClick={() => setShowDeleteConfirm(servico.id)}
                              title="Deletar"
                            >
                              <MdDelete />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="servicos__modal-overlay" onClick={() => setShowModal(false)}>
          <div className="servicos__modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="servicos__modal-header">
              <h2>{editingId ? 'Editar Serviço' : 'Novo Serviço'}</h2>
              <button
                className="servicos__close-btn"
                onClick={() => setShowModal(false)}
                type="button"
                aria-label="Fechar"
              >
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="servicos__modal-form">
              {/* 1. Data + Horário */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="data_servico">Data do Serviço *</label>
                  <input
                    id="data_servico"
                    type="date"
                    value={formData.data_servico}
                    onChange={(e) => setFormData({ ...formData, data_servico: e.target.value })}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="janela_inicio">Horário (Início) *</label>
                  <input
                    id="janela_inicio"
                    type="time"
                    value={formData.janela_inicio}
                    onChange={(e) => setFormData({ ...formData, janela_inicio: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 2. Tipo de Cliente + Cliente */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="tipo_cliente">Tipo de Cliente *</label>
                  <select
                    id="tipo_cliente"
                    value={formData.tipo_cliente}
                    onChange={(e) => handleTipoClienteChange(e.target.value)}
                    required
                  >
                    <option value="loja">Loja</option>
                    <option value="particular">Particular</option>
                  </select>
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="cliente_select">
                    {formData.tipo_cliente === 'loja' ? 'Loja *' : 'Cliente Particular *'}
                  </label>
                  <select
                    id="cliente_select"
                    value={formData.tipo_cliente === 'loja' ? formData.loja_id : formData.cliente_particular_id}
                    onChange={(e) => {
                      if (formData.tipo_cliente === 'loja') {
                        setFormData({ ...formData, loja_id: e.target.value });
                      } else {
                        handleClienteParticularSelect(e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">Selecionar...</option>
                    {formData.tipo_cliente === 'loja'
                      ? lojas?.map(l => (
                          <option key={l.id} value={l.id}>
                            {l.nome || l.nome_fantasia || l.razao_social}
                          </option>
                        ))
                      : particular?.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nome}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {/* 2.5 Informações do Cliente Final (apenas para lojas) */}
              {formData.tipo_cliente === 'loja' && (
                <>
                  <div className="servicos__form-row">
                    <div className="servicos__form-group">
                      <label htmlFor="cliente_final_nome">Nome do Cliente</label>
                      <input
                        id="cliente_final_nome"
                        type="text"
                        value={formData.cliente_final_nome}
                        onChange={(e) => setFormData({ ...formData, cliente_final_nome: e.target.value })}
                        placeholder="Nome do cliente que comprou na loja"
                      />
                    </div>
                    <div className="servicos__form-group">
                      <label htmlFor="cliente_final_contato">Contato do Cliente</label>
                      <input
                        id="cliente_final_contato"
                        type="text"
                        value={formData.cliente_final_contato}
                        onChange={(e) => setFormData({ ...formData, cliente_final_contato: formatTelefone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        maxLength="15"
                      />
                    </div>
                  </div>
                  <div className="servicos__form-row">
                    <div className="servicos__form-group">
                      <label htmlFor="codigo_os_loja">Código OS da Loja</label>
                      <input
                        id="codigo_os_loja"
                        type="text"
                        value={formData.codigo_os_loja}
                        onChange={(e) => setFormData({ ...formData, codigo_os_loja: e.target.value })}
                        placeholder="Ex: OS-12345"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 2.6 Informações do Cliente Particular (apenas para particulares) */}
              {formData.tipo_cliente === 'particular' && formData.cliente_particular_id && (
                <>
                  <div className="servicos__info-box servicos__info-box--auto">
                    ℹ️ Dados preenchidos automaticamente do cadastro do cliente. Você pode editá-los se necessário.
                  </div>
                  <div className="servicos__form-row">
                    <div className="servicos__form-group">
                      <label htmlFor="cliente_particular_nome">Nome do Cliente</label>
                      <input
                        id="cliente_particular_nome"
                        type="text"
                        value={formData.cliente_final_nome}
                        onChange={(e) => setFormData({ ...formData, cliente_final_nome: e.target.value })}
                        placeholder="Nome do cliente"
                      />
                    </div>
                    <div className="servicos__form-group">
                      <label htmlFor="cliente_particular_contato">Contato do Cliente</label>
                      <input
                        id="cliente_particular_contato"
                        type="text"
                        value={formData.cliente_final_contato}
                        onChange={(e) => setFormData({ ...formData, cliente_final_contato: formatTelefone(e.target.value) })}
                        placeholder="(00) 00000-0000"
                        maxLength="15"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 3. Endereço */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="endereco_rua">Rua *</label>
                  <input
                    id="endereco_rua"
                    type="text"
                    value={formData.endereco_rua}
                    onChange={(e) => setFormData({ ...formData, endereco_rua: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_rua', e.target.value)}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="endereco_numero">Número *</label>
                  <input
                    id="endereco_numero"
                    type="text"
                    value={formData.endereco_numero}
                    onChange={(e) => setFormData({ ...formData, endereco_numero: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_numero', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="endereco_bairro">Bairro</label>
                  <input
                    id="endereco_bairro"
                    type="text"
                    value={formData.endereco_bairro}
                    onChange={(e) => setFormData({ ...formData, endereco_bairro: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_bairro', e.target.value)}
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="endereco_cidade">Cidade *</label>
                  <input
                    id="endereco_cidade"
                    type="text"
                    value={formData.endereco_cidade}
                    onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_cidade', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="endereco_estado">Estado *</label>
                  <input
                    id="endereco_estado"
                    type="text"
                    value={formData.endereco_estado}
                    onChange={(e) => setFormData({ ...formData, endereco_estado: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_estado', e.target.value)}
                    required
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="endereco_cep">CEP *</label>
                  <input
                    id="endereco_cep"
                    type="text"
                    value={formData.endereco_cep}
                    onChange={(e) => setFormData({ ...formData, endereco_cep: e.target.value })}
                    onBlur={(e) => handleEnderecoBlur('endereco_cep', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Coordenadas GPS */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="latitude">
                    Latitude
                    {formData.latitude && <span style={{ marginLeft: '0.5rem', color: '#10b981', fontSize: '0.85rem' }}>✓ GPS OK</span>}
                    {!formData.latitude && <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontSize: '0.85rem' }}>⚠️ Sem GPS</span>}
                  </label>
                  <input
                    id="latitude"
                    type="text"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="Ex: -23.550520"
                  />
                </div>
                <div className="servicos__form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    id="longitude"
                    type="text"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="Ex: -46.633308"
                  />
                </div>
                <div className="servicos__form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button
                    type="button"
                    className="servicos__button servicos__button--geocode"
                    onClick={() => {
                      const endereco = buildEnderecoExecucao(formData);
                      if (endereco) {
                        geocodeAddress(endereco, { showFeedback: true });
                      } else {
                        showNotice('warning', 'Preencha o endereço completo primeiro.');
                      }
                    }}
                    title="Buscar coordenadas do endereço"
                  >
                    📍 Buscar GPS
                  </button>
                </div>
              </div>

              {/* 4. Atribuição + Montador/Equipe */}
              <div className="servicos__form-row">
                <div className="servicos__form-group">
                  <label htmlFor="atribuicao">Atribuição</label>
                  <select
                    id="atribuicao"
                    value={tipoAtribuicao}
                    onChange={(e) => {
                      const tipo = e.target.value;
                      setTipoAtribuicao(tipo);
                      if (tipo === 'individual') {
                        setEquipeSelecionada('');
                        setTabMontadores([{ usuario_id: '', valor_atribuido: 0, papel: 'principal' }]);
                      } else {
                        // Limpar montadores quando mudar para equipe
                        setTabMontadores([]);
                        setEquipeSelecionada('');
                      }
                    }}
                  >
                    <option value="individual">Montador Individual</option>
                    <option value="equipe">Equipe</option>
                  </select>
                </div>
                
                {tipoAtribuicao === 'individual' ? (
                  <div className="servicos__form-group">
                    <label htmlFor="montador_select">Montador</label>
                    <select
                      id="montador_select"
                      value={tabMontadores[0]?.usuario_id || ''}
                      onChange={(e) => {
                        if (tabMontadores.length === 0) {
                          setTabMontadores([{ usuario_id: e.target.value, valor_atribuido: 0, papel: 'principal' }]);
                        } else {
                          const updated = [...tabMontadores];
                          updated[0].usuario_id = e.target.value;
                          setTabMontadores(updated);
                        }
                      }}
                    >
                      <option value="">Selecionar...</option>
                      {usuarios
                        ?.filter(u => u.tipo === 'montador')
                        .map(u => (
                          <option key={u.id} value={u.id}>
                            {u.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="servicos__form-group">
                    <label htmlFor="equipe_select">Equipe</label>
                    <select
                      id="equipe_select"
                      value={equipeSelecionada}
                      onChange={(e) => {
                        const equipaId = e.target.value;
                        setEquipeSelecionada(equipaId);
                        if (equipaId) {
                          setTabMontadores(buildEquipeMontadores(equipaId));
                        } else {
                          setTabMontadores([]);
                        }
                      }}
                    >
                      <option value="">Selecionar...</option>
                      {equipes?.map(eq => (
                        <option key={eq.id} value={eq.id}>
                          {eq.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {tipoAtribuicao === 'equipe' && equipeSelecionada && (
                <div className="servicos__form-section">
                  <h3 className="servicos__section-title">Percentual de salário por montador da equipe</h3>

                  {tabMontadores.length === 0 ? (
                    <p className="servicos__no-items">Esta equipe não possui montadores cadastrados.</p>
                  ) : (
                    <div className="servicos__table-wrapper">
                      <table className="servicos__table">
                        <thead>
                          <tr>
                            <th>Montador</th>
                            <th>% Salário no Serviço</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tabMontadores.map((montador, idx) => (
                            <tr key={`${montador.equipe_id}-${montador.usuario_id}`}>
                              <td>{usuariosById[montador.usuario_id]?.nome || 'Montador'}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  value={montador.percentual_divisao ?? ''}
                                  onChange={(e) => {
                                    const valor = e.target.value;
                                    const percentual = valor === '' ? '' : Math.min(Math.max(Number(valor), 0), 100);
                                    handleUpdateMontador(idx, 'percentual_divisao', percentual);
                                  }}
                                  className="servicos__produto-qty"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 5. Status */}
              <div className="servicos__form-group servicos__form-group--full">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_rota">Em Rota</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* 6. Seção Produtos com Tabela */}
              <div className="servicos__form-section">
                <h3 className="servicos__section-title">Produtos</h3>
                
                {(formData.tipo_cliente === 'particular' || formData.loja_id) && (
                  <>
                    <div className="servicos__filter-row">
                      <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchProduto}
                        onChange={(e) => setSearchProduto(e.target.value)}
                        className="servicos__filter-input"
                      />
                      {categoriasLoja.length > 0 && (
                        <select
                          value={categoriaProduto}
                          onChange={(e) => setCategoriaProduto(e.target.value)}
                          className="servicos__filter-select"
                        >
                          <option value="">Todas as categorias</option>
                          {categoriasLoja.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {tabProdutos.length > 0 ? (
                      <div className="servicos__produtos-table-wrapper">
                        <table className="servicos__produtos-table">
                          <thead>
                            <tr>
                              <th>Produto</th>
                              <th>Qtd</th>
                              <th>Valor Unitário</th>
                              <th>Desconto</th>
                              <th>Total</th>
                              <th>Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tabProdutos.map((produto, idx) => (
                              <tr key={idx}>
                                <td>
                                  <select
                                    value={produto.produto_id}
                                    onChange={(e) => handleUpdateProduto(idx, 'produto_id', e.target.value)}
                                    required
                                    className="servicos__produto-select"
                                  >
                                    <option value="">Selecionar...</option>
                                    {produtosFilterados?.map(p => (
                                      <option key={p.id} value={p.id}>
                                        {p.nome} {p.categoria ? `(${p.categoria})` : ''}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min="1"
                                    value={produto.quantidade}
                                    onChange={(e) => handleUpdateProduto(idx, 'quantidade', Number(e.target.value))}
                                    className="servicos__produto-qty"
                                  />
                                </td>
                                <td>
                                  <span className="servicos__produto-valor">
                                    R$ {Number(produto.valor_unitario || 0).toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <div className="servicos__produto-discount-cell">
                                    <label className="servicos__produto-discount-toggle">
                                      <input
                                        type="checkbox"
                                        checked={Boolean(produto.utilizar_desconto)}
                                        onChange={(e) => handleUpdateProduto(idx, 'utilizar_desconto', e.target.checked)}
                                      />
                                      <span>Utilizar desconto</span>
                                    </label>

                                    {produto.utilizar_desconto && (
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        max={getProdutoSubtotal(produto).toFixed(2)}
                                        value={produto.valor_desconto}
                                        onChange={(e) => handleUpdateProduto(idx, 'valor_desconto', e.target.value)}
                                        className="servicos__produto-discount-input"
                                        placeholder="0,00"
                                      />
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className="servicos__produto-total">
                                    R$ {getProdutoTotal(produto).toFixed(2)}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="servicos__remove-btn"
                                    onClick={() => handleRemoveProduto(idx)}
                                    aria-label="Remover produto"
                                  >
                                    <MdDelete size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="servicos__no-items">Nenhum produto adicionado.</p>
                    )}

                    <button
                      type="button"
                      className="servicos__btn-add-item"
                      onClick={handleAddProduto}
                    >
                      <MdAdd size={18} /> Adicionar Produto
                    </button>
                  </>
                )}

                {formData.tipo_cliente === 'loja' && !formData.loja_id && (
                  <p className="servicos__no-items">Selecione uma loja para adicionar produtos.</p>
                )}

                {formData.tipo_cliente === '' && (
                  <p className="servicos__no-items">Selecione o tipo de cliente (Loja ou Particular).</p>
                )}
              </div>

              {/* 7. Utilitários / Extras */}
              <div className="servicos__form-section">
                <h3 className="servicos__section-title">Utilitários / Extras</h3>
                <p className="servicos__section-desc" style={{ marginBottom: '12px', color: '#666', fontSize: '0.875rem' }}>
                  Custos adicionais fora da montagem (ex: gasolina, parafusos, embalagens).
                </p>

                {tabExtras.length > 0 ? (
                  <div className="servicos__produtos-table-wrapper">
                    <table className="servicos__produtos-table">
                      <thead>
                        <tr>
                          <th>Descrição</th>
                          <th>Valor (R$)</th>
                          <th>Observação</th>
                          <th>Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tabExtras.map((extra, idx) => (
                          <tr key={idx}>
                            <td>
                              <input
                                type="text"
                                value={extra.descricao}
                                onChange={(e) => handleUpdateExtra(idx, 'descricao', e.target.value)}
                                placeholder="Ex: Gasolina, Parafusos..."
                                className="servicos__produto-select"
                                maxLength={200}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={extra.valor}
                                onChange={(e) => handleUpdateExtra(idx, 'valor', parseNumericValue(e.target.value))}
                                className="servicos__produto-qty"
                                style={{ width: '100px' }}
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={extra.observacao || ''}
                                onChange={(e) => handleUpdateExtra(idx, 'observacao', e.target.value)}
                                placeholder="Opcional..."
                                className="servicos__produto-select"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="servicos__remove-btn"
                                onClick={() => handleRemoveExtra(idx)}
                                aria-label="Remover extra"
                              >
                                <MdDelete size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="servicos__no-items">Nenhum extra adicionado.</p>
                )}

                <button
                  type="button"
                  className="servicos__btn-add-item"
                  onClick={handleAddExtra}
                >
                  <MdAdd size={18} /> Adicionar Extra
                </button>
              </div>

              {/* 8. Observações */}
              <div className="servicos__form-group servicos__form-group--full">
                <label htmlFor="observacoes">Observações</label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  rows={3}
                  placeholder="Adicione observações sobre o serviço..."
                />
              </div>

              {/* 8. Anexos */}
              {editingId && (
                <div className="servicos__form-section">
                  <h3 className="servicos__section-title">📎 Anexos</h3>
                  
                  <div className="servicos__anexos-upload">
                    <label htmlFor="arquivo-input" className="servicos__btn servicos__btn--primary" style={{ cursor: 'pointer' }}>
                      📤 Fazer Upload
                    </label>
                    <input
                      id="arquivo-input"
                      type="file"
                      onChange={handleUploadAnexo}
                      disabled={uploadingAnexo}
                      style={{ display: 'none' }}
                    />
                    {uploadingAnexo && <span style={{ marginLeft: '10px', color: '#666' }}>Enviando...</span>}
                  </div>

                  {anexos.length > 0 ? (
                    <div className="servicos__anexos-list">
                      {anexos.map((anexo) => (
                        <div key={anexo.id} className="servicos__anexo-item">
                          <div className="servicos__anexo-info">
                            <span className="servicos__anexo-name">📄 {anexo.nome_arquivo}</span>
                            <span className="servicos__anexo-size">
                              ({(anexo.tamanho_bytes / 1024).toFixed(2)} KB)
                            </span>
                          </div>
                          <div className="servicos__anexo-actions">
                            <button
                              type="button"
                              onClick={() => handleDownloadAnexo(anexo)}
                              className="servicos__btn-icon"
                              title="Download"
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => setAnexoToDelete(anexo.id)}
                              className="servicos__btn-icon servicos__btn-icon--danger"
                              title="Remover"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="servicos__no-items">Nenhum anexo adicionado.</p>
                  )}
                </div>
              )}

              {/* 9. Total + Botões */}
              <div className="servicos__form-footer">
                <div className="servicos__total">
                  <span className="servicos__total-label">Total (R$):</span>
                  <span className="servicos__total-value">
                    {tabProdutos.reduce((acc, produto) => acc + getProdutoTotal(produto), 0).toFixed(2)}
                  </span>
                </div>

                <div className="servicos__form-actions">
                  <button
                    type="button"
                    className="servicos__btn servicos__btn--secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="servicos__btn servicos__btn--primary"
                  >
                    {editingId ? 'Atualizar Serviço' : 'Criar Serviço'}
                  </button>
                </div>
              </div>

              {/* Campos ocultos */}
              <input type="hidden" name="janela_fim" value={formData.janela_fim} />
              <input type="hidden" name="prioridade" value={formData.prioridade} />
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="servicos__modal-overlay" onClick={() => { setShowDeleteConfirm(null); setDeleteError(null); }}>
          <div className="servicos__modal-content servicos__modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="servicos__modal-header">
              <h3>
                {deleteError ? '❌ Não é possível deletar' : '⚠️ Confirmar Exclusão'}
              </h3>
            </div>
            
            {deleteError ? (
              <>
                <div style={{ padding: '20px 0', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#d32f2f' }}>
                    {deleteError.title}
                  </h4>
                  <p style={{ marginBottom: '15px', lineHeight: '1.5', color: '#555' }}>
                    {deleteError.message}
                  </p>
                  {deleteError.rotas && (
                    <div style={{ 
                      backgroundColor: '#fff3e0', 
                      border: '1px solid #ffe0b2', 
                      borderRadius: '4px', 
                      padding: '12px',
                      marginTop: '10px'
                    }}>
                      <p style={{ margin: '0', fontSize: '14px', color: '#e65100' }}>
                        ℹ️ Este serviço está associado a <strong>{deleteError.rotas} rota(s)</strong>
                      </p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#e65100' }}>
                        Remova o serviço das rotas antes de tentar deletá-lo.
                      </p>
                    </div>
                  )}
                </div>
                <div className="servicos__modal-footer">
                  <button
                    className="servicos__btn servicos__btn--primary"
                    onClick={() => { setShowDeleteConfirm(null); setDeleteError(null); }}
                  >
                    Entendi
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Tem certeza que deseja deletar este serviço?</p>
                {servicoRotasCount[showDeleteConfirm] && servicoRotasCount[showDeleteConfirm].length > 0 && (
                  <div style={{ 
                    backgroundColor: '#ffebee', 
                    border: '1px solid #ffcdd2', 
                    borderRadius: '4px', 
                    padding: '12px',
                    marginTop: '12px'
                  }}>
                    <p style={{ margin: '0', fontSize: '13px', color: '#c62828' }}>
                      ⚠️ <strong>Aviso:</strong> Este serviço está associado a <strong>{servicoRotasCount[showDeleteConfirm].length} rota(s)</strong>
                    </p>
                  </div>
                )}
                <div className="servicos__modal-footer">
                  <button
                    className="servicos__btn servicos__btn--secondary"
                    onClick={() => { setShowDeleteConfirm(null); setDeleteError(null); }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="servicos__btn servicos__btn--danger"
                    onClick={handleDelete}
                  >
                    Deletar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {anexoToDelete && (
        <div className="servicos__modal-overlay" onClick={() => setAnexoToDelete(null)}>
          <div className="servicos__modal-content servicos__modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="servicos__modal-header">
              <h3>⚠️ Confirmar remoção</h3>
            </div>
            <p>Deseja remover este anexo?</p>
            <div className="servicos__modal-footer">
              <button
                className="servicos__btn servicos__btn--secondary"
                onClick={() => setAnexoToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="servicos__btn servicos__btn--danger"
                onClick={() => handleRemoveAnexo(anexoToDelete)}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {anexoToDelete && (
        <div className="servicos__modal-overlay" onClick={() => setAnexoToDelete(null)}>
          <div className="servicos__modal-content servicos__modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="servicos__modal-header">
              <h3>⚠️ Confirmar remoção</h3>
            </div>
            <p>Deseja remover este anexo?</p>
            <div className="servicos__modal-footer">
              <button
                className="servicos__btn servicos__btn--secondary"
                onClick={() => setAnexoToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="servicos__btn servicos__btn--danger"
                onClick={() => handleRemoveAnexo(anexoToDelete)}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Servicos;
