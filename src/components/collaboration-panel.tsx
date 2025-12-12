"use client"

import { useState } from "react"
import { 
  Users, 
  MessageSquare, 
  History, 
  User, 
  Clock, 
  CheckCircle, 
  XCircle,
  Reply,
  Trash2,
  RotateCcw,
  Plus,
  Search,
  Filter
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Collaborator {
  id: string
  name: string
  email: string
  role: "owner" | "editor" | "commenter" | "viewer"
  avatar: string
  status: "online" | "offline" | "away"
}

interface Comment {
  id: string
  author: string
  avatar: string
  content: string
  timestamp: Date
  resolved: boolean
  replies?: Comment[]
}

interface Version {
  id: string
  author: string
  timestamp: Date
  message: string
  changes: {
    added: number
    removed: number
    modified: number
  }
}

interface CollaborationPanelProps {
  collaborators: Collaborator[]
  comments: Comment[]
  versions: Version[]
  onAddComment: (comment: any) => void
  onResolveComment: (commentId: string) => void
  onRevertVersion: (versionId: string) => void
}

const roleColors = {
  owner: "bg-purple-100 text-purple-800",
  editor: "bg-blue-100 text-blue-800",
  commenter: "bg-green-100 text-green-800",
  viewer: "bg-gray-100 text-gray-800"
}

const statusColors = {
  online: "bg-green-500",
  offline: "bg-gray-400",
  away: "bg-yellow-500"
}

export default function CollaborationPanel({
  collaborators,
  comments,
  versions,
  onAddComment,
  onResolveComment,
  onRevertVersion,
}: CollaborationPanelProps) {
  const [newComment, setNewComment] = useState("")
  const [selectedComment, setSelectedComment] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "resolved" | "pending">("all")

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      author: "Usuario Actual",
      avatar: "/placeholder.svg?height=32&width=32",
      content: newComment,
      timestamp: new Date(),
      resolved: false
    }

    onAddComment(comment)
    setNewComment("")
  }

  const handleReply = (commentId: string) => {
    if (!replyContent.trim()) return

    const reply: Comment = {
      id: `reply-${Date.now()}`,
      author: "Usuario Actual",
      avatar: "/placeholder.svg?height=32&width=32",
      content: replyContent,
      timestamp: new Date(),
      resolved: false
    }

    // In a real implementation, this would add the reply to the comment
    setReplyContent("")
    setSelectedComment(null)
  }

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comment.author.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === "all" || 
                        (filterStatus === "resolved" && comment.resolved) ||
                        (filterStatus === "pending" && !comment.resolved)
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "ahora mismo"
    if (diffInMinutes < 60) return `hace ${diffInMinutes} minutos`
    if (diffInMinutes < 1440) return `hace ${Math.floor(diffInMinutes / 60)} horas`
    return `hace ${Math.floor(diffInMinutes / 1440)} días`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <Users className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-bold font-serif">Colaboración</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Trabaja en equipo con otros colaboradores, gestiona comentarios y 
          sigue el historial de cambios de tu libro.
        </p>
      </div>

      <Tabs defaultValue="collaborators" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="collaborators">Colaboradores</TabsTrigger>
          <TabsTrigger value="comments">Comentarios</TabsTrigger>
          <TabsTrigger value="versions">Versiones</TabsTrigger>
        </TabsList>

        <TabsContent value="collaborators" className="space-y-4">
          <Card className="surface-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Equipo de Trabajo
                  </CardTitle>
                  <CardDescription>
                    {collaborators.length} colaboradores en este proyecto
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Invitar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg surface-1">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                          <AvatarFallback>{collaborator.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${statusColors[collaborator.status]}`} />
                      </div>
                      <div>
                        <p className="font-medium">{collaborator.name}</p>
                        <p className="text-sm text-muted-foreground">{collaborator.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={roleColors[collaborator.role]}>
                        {collaborator.role === 'owner' ? 'Propietario' :
                         collaborator.role === 'editor' ? 'Editor' :
                         collaborator.role === 'commenter' ? 'Comentador' : 'Lector'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {collaborator.status === 'online' ? 'En línea' :
                         collaborator.status === 'offline' ? 'Desconectado' : 'Ausente'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {/* Add Comment */}
          <Card className="surface-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Añadir Comentario
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-comment">Tu comentario</Label>
                <Textarea
                  id="new-comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Añade un comentario sobre el contenido..."
                  className="min-h-[100px]"
                />
              </div>
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Comentario
              </Button>
            </CardContent>
          </Card>

          {/* Comments List */}
          <Card className="surface-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Comentarios</CardTitle>
                  <CardDescription>
                    {filteredComments.length} comentarios
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar comentarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="resolved">Resueltos</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredComments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay comentarios para mostrar</p>
                  </div>
                ) : (
                  filteredComments.map((comment) => (
                    <div key={comment.id} className={`p-4 border rounded-lg ${comment.resolved ? 'bg-muted/30' : 'surface-1'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.avatar} alt={comment.author} />
                            <AvatarFallback>{comment.author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{comment.author}</p>
                            <p className="text-xs text-muted-foreground">{getTimeAgo(comment.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {comment.resolved && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resuelto
                            </Badge>
                          )}
                          {!comment.resolved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onResolveComment(comment.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Resolver
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed mb-3">{comment.content}</p>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedComment(comment.id)}
                        >
                          <Reply className="w-4 h-4 mr-1" />
                          Responder
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      
                      {/* Reply Input */}
                      {selectedComment === comment.id && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Escribe tu respuesta..."
                            className="min-h-[60px] mb-2"
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={() => handleReply(comment.id)}>
                              Enviar Respuesta
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setSelectedComment(null)}>
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="versions" className="space-y-4">
          <Card className="surface-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                Historial de Versiones
              </CardTitle>
              <CardDescription>
                Sigue los cambios y vuelve a versiones anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div key={version.id} className="p-4 border rounded-lg surface-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {versions.length - index}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{version.author}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(version.timestamp)}</p>
                        </div>
                      </div>
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onRevertVersion(version.id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Revertir
                        </Button>
                      )}
                    </div>
                    <p className="text-sm mb-3">{version.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>+{version.changes.added} añadidos</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>-{version.changes.removed} eliminados</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>{version.changes.modified} modificados</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats */}
      <Card className="surface-2">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{collaborators.length}</div>
              <div className="text-sm text-muted-foreground">Colaboradores</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {comments.filter(c => !c.resolved).length}
              </div>
              <div className="text-sm text-muted-foreground">Comentarios Pendientes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {comments.filter(c => c.resolved).length}
              </div>
              <div className="text-sm text-muted-foreground">Comentarios Resueltos</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">{versions.length}</div>
              <div className="text-sm text-muted-foreground">Versiones</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}