"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Lock } from "lucide-react"

type User = "vii" | "zud" | null

type SettingsAuthProps = {
  onAuthenticated: (user: User) => void
}

export default function SettingsAuth({ onAuthenticated }: SettingsAuthProps) {
  const [selectedUser, setSelectedUser] = useState<"vii" | "zud" | null>(null)
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState("")
  const [step, setStep] = useState<"select" | "verify">("select")

  const handleSelectUser = (user: "vii" | "zud") => {
    setSelectedUser(user)
    setStep("verify")
    setAnswer("")
    setError("")
  }

  const handleVerify = () => {
    const normalizedAnswer = answer.toLowerCase().replace(/\s+/g, " ").trim()

    // Check for "4 april" variations
    const viiAnswers = ["4 april", "4april", "april 4", "april4", "04 april", "04april"]
    // Check for "10 april" variations
    const zudAnswers = ["10 april", "10april", "april 10", "april10"]

    const isViiAnswer = viiAnswers.some((a) => normalizedAnswer.includes(a) || normalizedAnswer === "4")
    const isZudAnswer = zudAnswers.some((a) => normalizedAnswer.includes(a) || normalizedAnswer === "10")

    if (selectedUser === "vii" && isViiAnswer) {
      onAuthenticated("vii")
    } else if (selectedUser === "zud" && isZudAnswer) {
      onAuthenticated("zud")
    } else {
      setError("Jawaban tidak sesuai. Silakan coba lagi.")
    }
  }

  const handleBack = () => {
    setStep("select")
    setSelectedUser(null)
    setAnswer("")
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 md:p-6">
      <Card className="w-full max-w-md bg-slate-900/80 border-slate-700/50 backdrop-blur-xl mx-4">
        <CardHeader className="text-center space-y-4 px-4 md:px-6">
          <div className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
            <Lock className="w-7 h-7 md:w-8 md:h-8 text-pink-400" />
          </div>
          <CardTitle className="text-xl md:text-2xl font-light text-white tracking-wide">Gallery Settings</CardTitle>
          <CardDescription className="text-slate-400 text-sm md:text-base">
            {step === "select" ? "Pilih identitas untuk melanjutkan" : "Jawab pertanyaan untuk verifikasi"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-4 md:px-6">
          {step === "select" ? (
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button
                onClick={() => handleSelectUser("vii")}
                className="group p-4 md:p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/50 hover:bg-slate-800 transition-all duration-300 active:scale-95"
              >
                <div className="flex flex-col items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="text-white font-medium text-base md:text-lg">Vii</span>
                </div>
              </button>

              <button
                onClick={() => handleSelectUser("zud")}
                className="group p-4 md:p-6 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-300 active:scale-95"
              >
                <div className="flex flex-col items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Heart className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <span className="text-white font-medium text-base md:text-lg">Zud</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-5 md:space-y-6">
              <div className="text-center p-3 md:p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
                <p className="text-slate-300 text-xs md:text-sm mb-1 md:mb-2">Masuk sebagai</p>
                <p className="text-lg md:text-xl font-medium text-white">{selectedUser === "vii" ? "Vii" : "Zud"}</p>
              </div>

              <div className="space-y-2 md:space-y-3">
                <Label htmlFor="answer" className="text-slate-300 text-center block text-sm md:text-base">
                  Berapa tanggal lahir pasangan?
                </Label>
                <p className="text-xs text-slate-500 text-center">(contoh format: 4 April)</p>
                <Input
                  id="answer"
                  type="text"
                  placeholder="Masukkan tanggal dan bulan..."
                  value={answer}
                  onChange={(e) => {
                    setAnswer(e.target.value)
                    setError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerify()
                  }}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-pink-500/50 text-base h-11 md:h-10"
                />
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-transparent h-11 md:h-10"
                >
                  Kembali
                </Button>
                <Button
                  onClick={handleVerify}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0 h-11 md:h-10"
                >
                  Verifikasi
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
