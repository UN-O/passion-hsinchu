"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/ui/header"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import LightRays from "@/components/ui/light-rays"
import { Users, Calendar, MapPin, ArrowDown, Zap, Heart, Flame } from "lucide-react"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={containerRef} className="bg-transparent text-white overflow-x-hidden">
      <Header />

      {/* Hero Section - 無飽和度深灰色景 */}
      <motion.section
        className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center relative overflow-hidden"
        style={{ y, opacity }}
      >
        <div className="absolute inset-0 z-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#eed688"
            raysSpeed={1.2}
            lightSpread={0.6}
            rayLength={1.5}
            followMouse={true}
            mouseInfluence={0.08}
            noiseAmount={0.15}
            distortion={0.03}
            className="opacity-30"
          />
        </div>

        <div className="text-center space-y-8 px-4 relative z-10 max-w-4xl mx-auto">
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <Image
              src="/images/rebirth-logo.png"
              alt="2025 Passion Camp - Rebirth"
              width={500}
              height={400}
              className="mx-auto drop-shadow-2xl brightness-0 invert"
              priority
            />
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-2xl md:text-4xl font-black tracking-wider" style={{ color: "#eed688" }}>
              全新竹最火熱的營會
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-medium">點燃你人生的轉折點！</p>
          </motion.div>

          <motion.div
            className="pt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="font-black px-12 py-6 text-lg rounded-md transition-all duration-300 hover:scale-105 shadow-2xl border-2"
                style={{
                  backgroundColor: "#eed688",
                  color: "black",
                  borderColor: "#eed688",
                  boxShadow: "0 0 30px rgba(238, 214, 136, 0.5)",
                }}
              >
                進入系統
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        >
          <ArrowDown className="w-6 h-6" style={{ color: "#eed688" }} />
        </motion.div>
      </motion.section>

      <motion.section
        className="py-24 px-4 bg-neutral-950 text-white relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            className="text-center space-y-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="space-y-8">
              <motion.div
                className="inline-flex items-center gap-3 px-6 py-3 bg-black/5 rounded-full border border-black/10"
                whileHover={{ scale: 1.05 }}
              >
                <Zap className="w-6 h-6" style={{ color: "#eed688" }} />
                <span className="text-lg font-black" style={{ color: "#eed688" }}>
                  REBIRTH EXPERIENCE
                </span>
              </motion.div>

              <h2 className="text-4xl md:text-6xl font-black leading-tight text-white">
                我們相信每個人都能在這裡
                <span className="relative inline-block">
                  <span style={{ color: "#eed688" }}>遇見神</span>
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 rounded-full"
                    style={{ backgroundColor: "#eed688" }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </span>
              </h2>

              <p className="text-xl md:text-2xl text-white/70 leading-relaxed max-w-4xl mx-auto">
                在這個虛無主義的世代，每個人都在尋找生命的意義與方向。
                <br />
                <span className="font-black text-white">Passion Camp 不只是一個營會，而是一個經歷神的機會。</span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <motion.div
                className="group bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-sm border border-black/10 rounded-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500"
                whileHover={{ scale: 1.05, y: -10 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <Heart
                    className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: "#eed688" }}
                  />
                </div>
                <h3 className="text-2xl font-black" style={{ color: "#eed688" }}>
                  深深敬拜
                </h3>
                <p className="text-white/70 leading-relaxed">
                  我們相信敬拜不是指樂器或歌聲，而是一種以心靈與誠實獻上自己的態度。
                </p>
              </motion.div>

              <motion.div
                className="group bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-sm border border-black/10 rounded-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500"
                whileHover={{ scale: 1.05, y: -10 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <Users
                    className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: "#eed688" }}
                  />
                </div>
                <h3 className="text-2xl font-black" style={{ color: "#eed688" }}>
                  建造關係
                </h3>
                <p className="text-white/70 leading-relaxed">
                  嘗試在這個營會中主動開啟對話，與神同心與人同行，成為彼此生命中的伯樂。
                </p>
              </motion.div>

              <motion.div
                className="group bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-sm border border-black/10 rounded-xl p-8 space-y-6 hover:shadow-2xl transition-all duration-500"
                whileHover={{ scale: 1.05, y: -10 }}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="relative">
                  <Flame
                    className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ color: "#eed688" }}
                  />
                </div>
                <h3 className="text-2xl font-black" style={{ color: "#eed688" }}>
                  遇見神
                </h3>
                <p className="text-white/70 leading-relaxed">
                  只有一個目的就是希望你在這裡遇見神，唯有透過遇見神，生命才能有改變。
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Info Section - 無飽和度深灰色背景 */}
      <motion.section
        className="py-20 px-4 bg-neutral-800 text-white relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-16 relative z-10">
          <motion.h2
            className="text-3xl md:text-4xl font-black"
            style={{ color: "#eed688" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            營會資訊
          </motion.h2>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-4 hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#eed688" }} />
              <h3 className="text-xl font-black" style={{ color: "#eed688" }}>
                限定對象
              </h3>
              <p className="text-white/70">新竹國高中生 - 大學生</p>
            </motion.div>

            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-4 hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: "#eed688" }} />
              <h3 className="text-xl font-black" style={{ color: "#eed688" }}>
                營會時間
              </h3>
              <p className="text-white/70">
                2025/8/21(四) pm.1:00
                <br />- 8/23(六) pm.5:00
              </p>
            </motion.div>

            <motion.div
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-8 space-y-4 hover:bg-white/10 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              <MapPin className="w-12 h-12 mx-auto mb-4" style={{ color: "#eed688" }} />
              <h3 className="text-xl font-black" style={{ color: "#eed688" }}>
                營會地點
              </h3>
              <p className="text-white/70">
                新竹聖經書院
                <br />
                新竹市東區高峰路56號
              </p>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
        className="max-w-md mx-auto mt-16 relative z-10"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        viewport={{ once: true }}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="w-full h-full font-black px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl border-2"
              style={{
                backgroundColor: "#eed688",
                color: "black",
                borderColor: "#eed688",
                boxShadow: "0 0 30px rgba(238, 214, 136, 0.3)",
              }}
            >
              點我查看活動時程表
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
      </motion.div>
      </motion.section>

      
    </div>
  )
}
