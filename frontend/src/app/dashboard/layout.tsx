'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  UserCircle,
  Package,
  Wallet,
  Receipt,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { api } from '@/services/api'
import { OrdemServico } from '@/lib/types'

function SidebarContent({ onNavigate, ordensAgendadas }: { onNavigate?: () => void, ordensAgendadas: number }) {
  const pathname = usePathname()

  const menuItems = [
  {
    title: 'Principal',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Ordens de Servico', href: '/dashboard/ordens-servico', icon: ClipboardList, badge: ordensAgendadas },
    ],
  },
  {
    title: 'Clientes',
    items: [
      { name: 'Lojas Parceiras', href: '/dashboard/lojas', icon: Building2 },
      { name: 'Particulares', href: '/dashboard/clientes', icon: UserCircle },
    ],
  },
  {
    title: 'Equipe',
    items: [
      { name: 'Montadores', href: '/dashboard/montadores', icon: Users },
      { name: 'Equipes', href: '/dashboard/equipes', icon: Users },
    ],
  },
  {
    title: 'Catalogo',
    items: [
      { name: 'Produtos', href: '/dashboard/produtos', icon: Package },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { name: 'Visao Geral', href: '/dashboard/financeiro', icon: Wallet },
      { name: 'Salarios', href: '/dashboard/financeiro/salarios', icon: DollarSign },
      { name: 'Pagamentos', href: '/dashboard/financeiro/pagamentos', icon: CreditCard },
      { name: 'Despesas', href: '/dashboard/financeiro/despesas', icon: Receipt },
    ],
  },
]

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Package className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">Montagex</span>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-6">
          {menuItems.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href))
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.name}</span>
                        {item.badge && item.badge > 0 && (
                          <Badge variant="secondary" className="h-5 min-w-5 justify-center bg-primary/20 text-primary text-xs">
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Configuracoes</span>
        </Link>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [ordensAgendadas, setOrdensAgendadas] = useState(0)

  useEffect(() => {
    async function fetchOrdens() {
        try {
          const res = await api.get('/servicos')
          const ordens = res.data?.data ?? res.data ?? []

          const agendadas = ordens.filter((o: OrdemServico) => o.status === 'agendada')

          setOrdensAgendadas(agendadas.length)
        } catch (err) {
          console.error('Erro ao buscar ordens:', err)
        }
      }

      fetchOrdens()
    }, [])


  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent ordensAgendadas={ordensAgendadas}/>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu de Navegacao</SheetTitle>
          <SidebarContent  ordensAgendadas={ordensAgendadas} onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:px-6">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
          </Sheet>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar ordens, clientes, montadores..."
              className="w-full bg-secondary/50 pl-9 border-0"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                3
              </span>
              <span className="sr-only">Notificacoes</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      AD
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden flex-col items-start text-left md:flex">
                    <span className="text-sm font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">admin@montagex.com</span>
                  </div>
                  <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configuracoes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
