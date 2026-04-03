'use client'

import { useState } from 'react'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Users,
  Crown,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { mockEquipes } from '@/lib/mock-data'
import { NovaEquipeDialog } from '@/components/equipes/nova-equipe-dialog'

export default function EquipesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredEquipes = mockEquipes.filter((equipe) => {
    return equipe.nome.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const stats = {
    total: mockEquipes.length,
    ativas: mockEquipes.filter(e => e.ativa).length,
    totalMembros: mockEquipes.reduce((acc, e) => acc + e.membros.length, 0),
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipes</h1>
          <p className="text-muted-foreground">
            Gerencie suas equipes de montagem
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Equipe
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Equipes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Equipes Ativas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.ativas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Membros</CardTitle>
            <Users className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{stats.totalMembros}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar equipes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Equipes Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEquipes.length === 0 ? (
          <div className="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground">Nenhuma equipe encontrada</p>
          </div>
        ) : (
          filteredEquipes.map((equipe) => (
            <Card key={equipe.id} className={cn(!equipe.ativa && 'opacity-60')}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    equipe.ativa ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <Users className={cn(
                      'h-5 w-5',
                      equipe.ativa ? 'text-primary' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{equipe.nome}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {equipe.membros.length} membro{equipe.membros.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acoes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {/* Lider */}
                  {equipe.lider && (
                    <div className="flex items-center gap-2 rounded-lg bg-primary/5 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {equipe.lider.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{equipe.lider.nome}</p>
                        <p className="text-xs text-muted-foreground">Lider</p>
                      </div>
                      <Crown className="h-4 w-4 text-primary" />
                    </div>
                  )}

                  {/* Membros */}
                  <div className="flex flex-col gap-2">
                    {equipe.membros
                      .filter(m => m.id !== equipe.lider?.id)
                      .map((membro) => (
                        <div key={membro.id} className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {membro.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{membro.nome}</span>
                        </div>
                      ))}
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Badge
                      variant="outline"
                      className={cn(
                        equipe.ativa
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-muted text-muted-foreground border-muted'
                      )}
                    >
                      {equipe.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Nova Equipe Dialog */}
      <NovaEquipeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
