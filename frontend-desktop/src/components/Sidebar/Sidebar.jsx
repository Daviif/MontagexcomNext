import React from 'react'
import { NavLink } from 'react-router-dom'
import { 
  MdClose,
  MdLogout,
  MdDashboard, 
  MdConstruction, 
  MdPeople, 
  MdInventory,
  MdGroups,
  MdRoute,
  MdAttachMoney,
  MdBarChart
} from 'react-icons/md'
import { FaBox } from 'react-icons/fa'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import './Sidebar.css'

const menuItems = [
  {
    path: '/dashboard',
    icon: MdDashboard,
    label: 'Dashboard'
  },
  {
    path: '/servicos',
    icon: MdConstruction,
    label: 'Serviços'
  },
  {
    path: '/clientes',
    icon: MdPeople,
    label: 'Clientes'
  },
  {
    path: '/produtos',
    icon: MdInventory,
    label: 'Produtos'
  },
  {
    path: '/equipe',
    icon: MdGroups,
    label: 'Equipe'
  },
  {
    path: '/rotas',
    icon: MdRoute,
    label: 'Rotas'
  },
  {
    path: '/financeiro',
    icon: MdAttachMoney,
    label: 'Financeiro'
  },
  {
    path: '/relatorios',
    icon: MdBarChart,
    label: 'Relatórios'
  }
]

const Sidebar = ({
  isOffline = false,
  queueStatus = { pending: 0, isSyncing: false },
  isOpen = false,
  onNavigate,
  onClose
}) => {
  const { user, signOut } = useAuth()

  const handleSignOut = () => {
    onClose?.()
    signOut()
  }

  const getConnectionStatus = () => {
    if (isOffline) {
      return {
        text: 'Offline',
        dotClass: 'status-dot status-dot--offline'
      }
    }

    if (queueStatus?.isSyncing) {
      return {
        text: `Sincronizando (${queueStatus.pending})`,
        dotClass: 'status-dot status-dot--syncing'
      }
    }

    if ((queueStatus?.pending || 0) > 0) {
      return {
        text: `Online • ${queueStatus.pending} pendente(s)`,
        dotClass: 'status-dot status-dot--pending'
      }
    }

    return {
      text: 'Online',
      dotClass: 'status-dot status-dot--online'
    }
  }

  const connectionStatus = getConnectionStatus()

  const avatarUrl = (() => {
    if (!user?.foto_perfil) return null
    if (user.foto_perfil.startsWith('http')) return user.foto_perfil

    const apiBase = api.defaults.baseURL || '/api'
    const baseWithoutApi = apiBase.replace(/\/api\/?$/, '')
    return `${baseWithoutApi}${user.foto_perfil}`
  })()

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <FaBox className="logo-icon" />
          <span className="logo-text">Montagex</span>
        </div>
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={onClose}
          aria-label="Fechar menu"
        >
          <MdClose />
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) => 
              `sidebar-nav-item ${isActive ? 'active' : ''}`
            }
          >
            <item.icon className="nav-icon" />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <NavLink
          to="/perfil"
          className="user-info user-info--link"
          title="Abrir perfil"
          onClick={onNavigate}
        >
          <div className="user-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="user-avatar-image" />
            ) : (
              user?.nome?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.nome || 'Usuário'}</div>
            <div className="user-role">
              {user?.tipo === 'admin' ? 'Administrador' : 'Montador'}
            </div>
            <div className="user-status">
              <span className={connectionStatus.dotClass}></span>
              <span className="status-text">{connectionStatus.text}</span>
            </div>
          </div>
        </NavLink>

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleSignOut}
        >
          <MdLogout className="sidebar-logout-icon" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
