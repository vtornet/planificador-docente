import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Eye, EyeOff } from 'lucide-react'
import docenzaIcon from '../../assets/docenza-icon.webp'

export function ResetPasswordScreen() {
  const completarNuevaPassword = useAuthStore((s) => s.completarNuevaPassword)

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState(false)

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await completarNuevaPassword(password)
      setHecho(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ha ocurrido un error. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground rounded-2xl shadow-[var(--shadow-strong)] border border-border p-8 max-w-lg w-full text-center animate-scale-in">
        <img src={docenzaIcon} alt="Docenza" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
        <h1 className="text-2xl font-bold text-foreground mb-3 tracking-tight">Nueva contraseña</h1>

        {hecho ? (
          <>
            <p className="text-muted-foreground mb-6">
              Tu contraseña se ha actualizado correctamente.
            </p>
            <Button size="lg" className="w-full" onClick={() => window.location.reload()}>
              Continuar
            </Button>
          </>
        ) : (
          <form
            className="space-y-3 text-left"
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
          >
            <p className="text-sm text-muted-foreground mb-2">Elige una contraseña nueva para tu cuenta.</p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Contraseña nueva</label>
              <div className="relative">
                <Input
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Repite la contraseña</label>
              <Input
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={enviando || password.length < 6 || !confirmar}
            >
              {enviando ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
