import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useCuadernoStore } from '../../stores/useCuadernoStore'
import { supabase } from '../../lib/supabaseClient'
import { PaywallDialog } from '../paywall/PaywallDialog'
import { ExportarAHorarioDialog } from './ExportarAHorarioDialog'
import { Button } from '../ui/button'
import { Sparkles, X, Send, CalendarPlus, Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface Mensaje {
  role: 'user' | 'assistant'
  content: string
}

// Vista activa → especialización del asistente. El estado interno se llama
// 'calendario' pero en la UI ese módulo se titula "Planificación" (mismo
// mapeo que usa AppHeader.tsx) — Horarios y Reuniones no tienen prompt
// propio todavía (V1 solo cubre Notas y Planificación), usan el genérico.
function moduloDeVista(view: string): { modulo: 'notas' | 'planificacion' | 'general'; label: string } {
  if (view === 'notas') return { modulo: 'notas', label: 'Notas' }
  if (view === 'calendario') return { modulo: 'planificacion', label: 'Planificación' }
  return { modulo: 'general', label: 'Asistente' }
}

export function AsistenteChat() {
  const hasPaid = useAuthStore((s) => s.hasPaid)
  const view = useCuadernoStore((s) => s.view)
  const { modulo, label } = moduloDeVista(view)

  const [open, setOpen] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportandoIdx, setExportandoIdx] = useState<number | null>(null)
  const [exportadoIdx, setExportadoIdx] = useState<number | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight })
  }, [mensajes, enviando])

  const handleToggle = () => {
    if (!hasPaid) {
      setShowPaywall(true)
      return
    }
    setOpen((o) => !o)
  }

  const handleEnviar = async () => {
    const texto = input.trim()
    if (!texto || enviando) return

    if (!navigator.onLine) {
      setError('El asistente necesita conexión a internet.')
      return
    }

    setError(null)
    const nuevosMensajes: Mensaje[] = [...mensajes, { role: 'user', content: texto }]
    setMensajes(nuevosMensajes)
    setInput('')
    setEnviando(true)

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: { modulo, mensaje: texto, historial: nuevosMensajes },
      })
      if (fnError) throw fnError
      setMensajes((prev) => [
        ...prev,
        { role: 'assistant', content: data?.respuesta || 'No he podido generar una respuesta.' },
      ])
    } catch (e) {
      setError('No se ha podido contactar con el asistente. Inténtalo de nuevo en un momento.')
    } finally {
      setEnviando(false)
    }
  }

  const handleExportado = (idx: number) => {
    setExportadoIdx(idx)
    setTimeout(() => setExportadoIdx((actual) => (actual === idx ? null : actual)), 4000)
  }

  return (
    <>
      <Button
        onClick={handleToggle}
        size="icon"
        className="fixed bottom-20 right-4 md:bottom-4 z-30 h-12 w-12 rounded-full shadow-[var(--shadow-strong)]"
        aria-label={open ? 'Cerrar asistente' : 'Abrir asistente de IA'}
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </Button>

      {open && hasPaid && (
        <div className="fixed bottom-36 right-4 md:bottom-20 z-30 w-[calc(100vw-2rem)] max-w-sm h-[28rem] max-h-[70vh] bg-card border border-border rounded-2xl shadow-[var(--shadow-strong)] flex flex-col overflow-hidden animate-scale-in">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-primary/5">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-medium text-foreground text-sm flex-1">Asistente · {label}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar asistente"
              className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listaRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {mensajes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Pregúntame lo que necesites — puedo ayudarte con redacción, ideas de actividades y más.
              </p>
            )}
            {mensajes.map((m, idx) => (
              <div key={idx} className={cn('max-w-[85%]', m.role === 'user' ? 'ml-auto' : '')}>
                <div
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  )}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && (
                  <div className="mt-1">
                    {exportadoIdx === idx ? (
                      <span className="inline-flex items-center gap-1 text-xs text-primary">
                        <Check className="w-3 h-3" /> Guardado en el horario
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExportandoIdx(idx)}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <CalendarPlus className="w-3 h-3" /> Exportar a un horario
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {enviando && <div className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm w-fit">Pensando…</div>}
            {error && (
              <p className="text-xs text-destructive text-center" role="alert">
                {error}
              </p>
            )}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleEnviar()
                }
              }}
              placeholder="Escribe tu pregunta…"
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
              disabled={enviando}
            />
            <Button size="icon" onClick={handleEnviar} disabled={enviando || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <PaywallDialog
        open={showPaywall}
        onOpenChange={setShowPaywall}
        modulo="El asistente de IA"
        modo="exclusivo"
      />

      {exportandoIdx !== null && (
        <ExportarAHorarioDialog
          open={exportandoIdx !== null}
          onOpenChange={(open) => !open && setExportandoIdx(null)}
          texto={mensajes[exportandoIdx]?.content || ''}
          onExportado={() => handleExportado(exportandoIdx)}
        />
      )}
    </>
  )
}
