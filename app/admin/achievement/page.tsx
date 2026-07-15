/**
 * 成就管理頁面
 * 管理成就列表和指派成就給組別
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { GROUPS } from "@/lib/constants"
import { Trophy, Edit, Users, Plus, Save, Calendar, Trash2 } from "lucide-react"

interface Achievement {
  id: number
  name: string
  description: string
  icon: string
  category: "scheduled" | "assigned"
  is_active: boolean
  scheduled_time?: string
  unlocked_count: number
  unlocked_teams: string[]
}

export default function AchievementManagementPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [deletingAchievement, setDeletingAchievement] = useState<Achievement | null>(null)
  const [newAchievement, setNewAchievement] = useState({
    name: "",
    description: "",
    icon: "Trophy",
    category: "assigned",
    scheduled_time: "",
  })

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const response = await fetch("/api/admin/achievements")
      if (response.ok) {
        const data = await response.json()
        const sortedData = data.sort((a: Achievement, b: Achievement) => a.id - b.id)
        setAchievements(sortedData)
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error)
    }
  }

  const formatDateTimeLocal = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    // 轉���為 UTC+8 時區
    const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    return utc8Date.toISOString().slice(0, 16)
  }

  const parseLocalDateTime = (localDateTime: string) => {
    if (!localDateTime) return ""
    // 將本地時間轉換為 UTC+8 時間字串
    const date = new Date(localDateTime)
    return date.toISOString()
  }

  const handleCreateAchievement = async () => {
    if (!newAchievement.name || !newAchievement.description) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newAchievement,
          scheduled_time: newAchievement.scheduled_time ? parseLocalDateTime(newAchievement.scheduled_time) : null,
          teams: newAchievement.category === "assigned" ? selectedTeams : [],
        }),
      })

      if (response.ok) {
        await fetchAchievements()
        setNewAchievement({ name: "", description: "", icon: "Trophy", category: "assigned", scheduled_time: "" })
        setSelectedTeams([])
      }
    } catch (error) {
      console.error("Failed to create achievement:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAchievement = async () => {
    if (!editingAchievement) return

    setLoading(true)
    try {
      const response = await fetch("/api/admin/achievements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAchievement.id,
          name: editingAchievement.name,
          description: editingAchievement.description,
          icon: editingAchievement.icon,
          category: editingAchievement.category,
          scheduled_time: editingAchievement.scheduled_time
            ? parseLocalDateTime(editingAchievement.scheduled_time)
            : null,
          teams: editingAchievement.category === "assigned" ? selectedTeams : [],
        }),
      })

      if (response.ok) {
        await fetchAchievements()
        setEditingAchievement(null)
        setSelectedTeams([])
        setIsEditing(false)
      }
    } catch (error) {
      console.error("Failed to update achievement:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAchievement = async (achievementId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/achievements?id=${achievementId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAchievements()
        setDeletingAchievement(null)
      } else {
        console.error("Failed to delete achievement")
      }
    } catch (error) {
      console.error("Failed to delete achievement:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTeamToggle = (teamName: string) => {
    setSelectedTeams((prev) => (prev.includes(teamName) ? prev.filter((t) => t !== teamName) : [...prev, teamName]))
  }

  const openEditDialog = (achievement: Achievement) => {
    setEditingAchievement({ ...achievement })
    setSelectedTeams(achievement.unlocked_teams || [])
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center space-x-2">
            <Trophy className="w-6 h-6" />
            <span>成就管理</span>
          </h1>
          <p className="text-muted-foreground mt-1">管理成就列表和指派成就給組別</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新增成就
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>新增成就</DialogTitle>
              <DialogDescription>創建新的成就並設定類型</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label>成就名稱</Label>
                  <Input
                    value={newAchievement.name}
                    onChange={(e) => setNewAchievement((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="輸入成就名稱"
                  />
                </div>

                <div className="space-y-2">
                  <Label>成就描述</Label>
                  <Textarea
                    value={newAchievement.description}
                    onChange={(e) => setNewAchievement((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="輸入成就描述"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>成就類型</Label>
                  <Select
                    value={newAchievement.category}
                    onValueChange={(value: "scheduled" | "assigned") =>
                      setNewAchievement((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">排程自動</SelectItem>
                      <SelectItem value="assigned">手動指派</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newAchievement.category === "scheduled" && (
                  <div className="space-y-2">
                    <Label>排程時間</Label>
                    <Input
                      type="datetime-local"
                      value={newAchievement.scheduled_time}
                      onChange={(e) => setNewAchievement((prev) => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">時間將以 UTC+8 時區儲存</p>
                  </div>
                )}

                {newAchievement.category === "assigned" && (
                  <div className="space-y-2">
                    <Label>指派給組別</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                      {GROUPS.map((group) => (
                        <div key={group.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`new-${group.name}`}
                            checked={selectedTeams.includes(group.name)}
                            onCheckedChange={() => handleTeamToggle(group.name)}
                          />
                          <label
                            htmlFor={`new-${group.name}`}
                            className="flex items-center space-x-2 cursor-pointer flex-1"
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                            <span>{group.name}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <Button
              onClick={handleCreateAchievement}
              className="w-full"
              disabled={!newAchievement.name || !newAchievement.description || loading}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "創建中..." : "創建成就"}
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {achievements.map((achievement) => (
          <Card key={achievement.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{achievement.name}</h3>
                      <Badge variant={achievement.category === "scheduled" ? "default" : "secondary"}>
                        {achievement.category === "scheduled" ? "排程" : "手動"}
                      </Badge>
                      {achievement.scheduled_time && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(achievement.scheduled_time).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}
                        </Badge>
                      )}
                      <Badge variant="outline">{achievement.unlocked_count} 人解鎖</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>

                    {achievement.unlocked_teams && achievement.unlocked_teams.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {achievement.unlocked_teams.map((team) => (
                            <Badge key={team} variant="outline" className="text-xs">
                              {team}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(achievement)}>
                        <Edit className="w-4 h-4 mr-2" />
                        編輯
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>編輯成就: {achievement.name}</DialogTitle>
                        <DialogDescription>編輯成就內容和指派設定</DialogDescription>
                      </DialogHeader>

                      <ScrollArea className="max-h-[60vh]">
                        <div className="space-y-4 pr-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="edit-mode"
                              checked={isEditing}
                              onCheckedChange={(checked) => setIsEditing(checked as boolean)}
                            />
                            <Label htmlFor="edit-mode">編輯成就內容</Label>
                          </div>

                          {isEditing ? (
                            <>
                              <div className="space-y-2">
                                <Label>成就名稱</Label>
                                <Input
                                  value={editingAchievement?.name || ""}
                                  onChange={(e) =>
                                    setEditingAchievement((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                  }
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>成就描述</Label>
                                <Textarea
                                  value={editingAchievement?.description || ""}
                                  onChange={(e) =>
                                    setEditingAchievement((prev) =>
                                      prev ? { ...prev, description: e.target.value } : null,
                                    )
                                  }
                                  rows={3}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>成就類型</Label>
                                <Select
                                  value={editingAchievement?.category}
                                  onValueChange={(value: "scheduled" | "assigned") =>
                                    setEditingAchievement((prev) => (prev ? { ...prev, category: value } : null))
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scheduled">排程自動</SelectItem>
                                    <SelectItem value="assigned">手動指派</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {editingAchievement?.category === "scheduled" && (
                                <div className="space-y-2 text-white">
                                  <Label>排程時間</Label>
                                  <Input
                                    className="[&::-webkit-calendar-picker-indicator] text-white bg-stone-300"
                                    type="datetime-local"
                                    value={formatDateTimeLocal(editingAchievement?.scheduled_time || "")}
                                    onChange={(e) =>
                                      setEditingAchievement((prev) =>
                                        prev ? { ...prev, scheduled_time: e.target.value } : null,
                                      )
                                    }
                                  />
                                  <p className="text-xs text-muted-foreground">時間將以 UTC+8 時區儲存</p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <h4 className="font-medium">{editingAchievement?.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{editingAchievement?.description}</p>
                            </div>
                          )}

                          {editingAchievement?.category === "assigned" && (
                            <div className="space-y-2">
                              <Label>指派給組別</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                                {GROUPS.map((group) => (
                                  <div key={group.id} className="flex items-center space-x-3">
                                    <Checkbox
                                      id={`${achievement.id}-${group.name}`}
                                      checked={selectedTeams.includes(group.name)}
                                      onCheckedChange={() => handleTeamToggle(group.name)}
                                    />
                                    <label
                                      htmlFor={`${achievement.id}-${group.name}`}
                                      className="flex items-center space-x-2 cursor-pointer flex-1"
                                    >
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                                      <span>{group.name}</span>
                                      <span className="text-muted-foreground text-sm">
                                        ({group.region === "R" ? "信心區" : group.region === "G" ? "盼望區" : "愛心區"})
                                      </span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>

                      <Button onClick={handleUpdateAchievement} className="w-full" disabled={loading}>
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "更新中..." : "儲存變更"}
                      </Button>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={deletingAchievement?.id === achievement.id}
                    onOpenChange={(open) => !open && setDeletingAchievement(null)}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingAchievement(achievement)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        刪除
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>確認刪除成就</DialogTitle>
                        <DialogDescription>
                          您確定要刪除「{achievement.name}」嗎？此操作將會：
                          <br />• 刪除成就本身
                          <br />• 移除所有組別的此成就記錄
                          <br />• 此操作無法復原
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex space-x-2 justify-end">
                        <Button variant="outline" onClick={() => setDeletingAchievement(null)} disabled={loading}>
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteAchievement(achievement.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {loading ? "刪除中..." : "確認刪除"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
