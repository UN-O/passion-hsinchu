/**
 * 經驗值管理頁面
 * 手動加分系統和加分紀錄管理
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { GROUPS } from "@/lib/constants"
import { Zap, Plus, Trash2, Clock } from "lucide-react"

interface ExpRecord {
  id: number
  team_name: string
  region: string
  exp_amount: number
  reason: string
  admin_name: string
  created_at: string
}

export default function ExpManagementPage() {
  const [selectedGroup, setSelectedGroup] = useState("")
  const [expAmount, setExpAmount] = useState("")
  const [reason, setReason] = useState("")
  const [records, setRecords] = useState<ExpRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [adminName] = useState("管理員")

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/admin/teams/exp")
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      }
    } catch (error) {
      console.error("Failed to fetch records:", error)
    }
  }

  const presetReasons = [
    { label: "PERK", exp: 200 },
    { label: "bonus (小)", exp: 50 },
    { label: "bonus (中)", exp: 100 },
    { label: "bonus (大)", exp: 200 },
    { label: "反應熱烈", exp: 100 },
    { label: "小競賽", exp: 200 },
    { label: "小隊呼", exp: 100 },
    { label: "最早到場", exp: 50 },
    { label: "對牧者有禮貌", exp: 77 },
    { label: "團隊合作", exp: 80 },
    { label: "創意表現", exp: 120 },
    { label: "準時集合", exp: 30 },
    { label: "環境整潔", exp: 60 },
    { label: "優秀表現", exp: 150 },
    { label: "MVP或特殊貢獻", exp: 200 },
    { label: "闖關勝利", exp: 500 },
  ]

  const handlePresetClick = (preset: { label: string; exp: number }) => {
    setReason(preset.label)
    setExpAmount(preset.exp.toString())
  }

  const handleAddExp = async () => {
    if (!selectedGroup || !expAmount || !reason) return

    setLoading(true)
    try {
      // Check if it's a region selection (starts with "region-")
      if (selectedGroup.startsWith("region-")) {
        const regionCode = selectedGroup.replace("region-", "")
        const regionTeams = GROUPS.filter((g) => g.region === regionCode)

        // Add experience to all teams in the region
        for (const team of regionTeams) {
          await fetch("/api/admin/teams/exp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              team_name: team.name,
              region: team.region,
              exp_amount: Number.parseInt(expAmount),
              reason: `${reason} (${regionCode}區集體加分)`,
              admin_name: adminName,
            }),
          })
        }
      } else {
        // Individual team selection
        const selectedGroupData = GROUPS.find((g) => g.id === selectedGroup)
        if (!selectedGroupData) return

        const response = await fetch("/api/admin/teams/exp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            team_name: selectedGroupData.name,
            region: selectedGroupData.region,
            exp_amount: Number.parseInt(expAmount),
            reason,
            admin_name: adminName,
          }),
        })
      }

      await fetchRecords()
      setSelectedGroup("")
      setExpAmount("")
      setReason("")
    } catch (error) {
      console.error("Failed to add exp:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/teams/exp?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchRecords()
      }
    } catch (error) {
      console.error("Failed to delete record:", error)
    }
  }

  const getTeamColor = (teamName: string) => {
    const team = GROUPS.find((g) => g.name === teamName)
    return team?.color || "#666"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center space-x-2">
          <Zap className="w-6 h-6" />
          <span>經驗值管理</span>
        </h1>
        <p className="text-muted-foreground mt-1">手動為組別加分和管理加分紀錄</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Add Experience Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>加分系統</span>
            </CardTitle>
            <CardDescription>為指定組別或整區增加經驗值（只能加正分）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label>選擇組別或區域</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇要加分的組別或區域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="region-O">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-400" />
                      <span className="font-medium">愛心區 (O區) - 集體加分</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="region-R">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-pink-400" />
                      <span className="font-medium">信心區 (R區) - 集體加分</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="region-G">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="font-medium">盼望區 (G區) - 集體加分</span>
                    </div>
                  </SelectItem>

                  {/* Separator */}
                  <div className="px-2 py-1">
                    <div className="border-t border-border" />
                    <p className="text-xs text-muted-foreground mt-1">個別組別</p>
                  </div>

                  {GROUPS.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                        <span>{group.name}</span>
                        <span className="text-muted-foreground">
                          ({group.region === "R" ? "信心區" : group.region === "G" ? "盼望區" : "愛心區"})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedGroup.startsWith("region-") && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">選擇區域加分將會同時為該區的三個組別加分</p>
              </div>
            )}

            {/* Experience Amount */}
            <div className="space-y-2">
              <Label>經驗值</Label>
              <Input
                type="number"
                placeholder="輸入經驗值數量"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                min="1"
              />
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>加分原因</Label>
              <Textarea
                placeholder="輸入加分原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preset Buttons */}
            <div className="space-y-2">
              <Label>常用原因</Label>
              <div className="flex flex-wrap gap-2">
                {presetReasons.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(preset)}
                    className="text-xs"
                  >
                    {preset.label} (+{preset.exp})
                  </Button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleAddExp}
              className="w-full"
              disabled={!selectedGroup || !expAmount || !reason || loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "加分中..." : selectedGroup.startsWith("region-") ? "區域加分" : "加分"}
            </Button>
          </CardContent>
        </Card>

        {/* Experience Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>加分紀錄</span>
            </CardTitle>
            <CardDescription>最近的加分紀錄，可以刪除錯誤的紀錄</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暫無加分紀錄</p>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex items-center space-x-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getTeamColor(record.team_name) }}
                          />
                          <Badge variant="outline">{record.team_name}</Badge>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          +{record.exp_amount} EXP
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{record.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(record.created_at).toLocaleString("zh-TW")} - {record.admin_name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRecord(record.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
