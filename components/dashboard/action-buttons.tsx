"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Wrench, ExternalLink } from "lucide-react"
import { EXTERNAL_LINKS } from "@/lib/constants"
import Image from "next/image"

export function ActionButtons() {
  const handleWorkshopClick = () => {
    window.open(EXTERNAL_LINKS.workshop, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">營會資訊</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
              <Calendar className="w-5 h-5 mr-3" />
              <span className="flex-1 text-left">查看流程表</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0 overflow-hidden">
            <ScrollArea className="h-full w-full overflow-y-auto">
              <div className="relative w-full min-h-[120vh]">
                <Image
                  src="/schedule-flowchart.png"
                  alt="2025 PASSION CAMP REBIRTH 營會流程表"
                  width={1200}
                  height={1600}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Button onClick={handleWorkshopClick} variant="outline" className="w-full justify-start h-12 bg-transparent">
          <Wrench className="w-5 h-5 mr-3" />
          <span className="flex-1 text-left">報名工作坊</span>
          <ExternalLink className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
