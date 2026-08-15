import { useState } from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../utils/cn'
import { Eye, EyeOff } from 'lucide-react'
import { PoliticaPrivacidad } from '../legal/PoliticaPrivacidad'
import { TerminosUso } from '../legal/TerminosUso'
import docenzaIcon from '../../assets/docenza-icon.png'

type Modo = 'login' | 'registro'

export function AuthScreen() {
  const { signIn, signUp, requestPasswordReset } = useAuthStore()

  const [modo, setModo] = useState<Modo>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [showPrivacidad, setShowPrivacidad] = useState(false)
  const [showTerminos, setShowTerminos] = useState(false)

  const cambiarModo = (nuevoModo: Modo) => {
    setModo(nuevoModo)
    setError(null)
    setMensaje(null)
  }

  const handleSubmit = async () => {
    if (!email.trim() || !password) return
    setEnviando(true)
    setError(null)
    setMensaje(null)
    try {
      if (modo === 'login') {
        await signIn(email.trim(), password)
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setMensaje('Cuenta creada. Revisa tu email para confirmarla y luego inicia sesión.')
          setModo('login')
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ha ocurrido un error. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  const handleOlvideContraseña = async () => {
    if (!email.trim()) {
      setError('Escribe tu email arriba y vuelve a pulsar "¿Olvidaste tu contraseña?"')
      return
    }
    setEnviando(true)
    setError(null)
    setMensaje(null)
    try {
      await requestPasswordReset(email.trim())
      setMensaje('Te hemos enviado un email con instrucciones para restablecer tu contraseña.')
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
        <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Docenza</h1>
        <p className="text-muted-foreground mb-8">Planificador Docente</p>

        <div className="flex rounded-lg bg-muted p-1 mb-6">
          <button
            type="button"
            onClick={() => cambiarModo('login')}
            className={cn(
              'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
              modo === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => cambiarModo('registro')}
            className={cn(
              'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
              modo === 'registro' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Crear cuenta
          </button>
        </div>

        <form
          className="space-y-3 text-left"
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Contraseña</label>
            <div className="relative">
              <Input
                type={mostrarPassword ? 'text' : 'password'}
                autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
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

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {mensaje && <p className="text-sm text-primary">{mensaje}</p>}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={enviando || !email.trim() || password.length < 6}
          >
            {enviando ? 'Un momento…' : modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </Button>

          {modo === 'login' && (
            <button
              type="button"
              onClick={handleOlvideContraseña}
              disabled={enviando}
              className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 block mx-auto"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </form>

        <p className="text-xs text-muted-foreground mt-6">
          Al continuar, aceptas los{' '}
          <button type="button" onClick={() => setShowTerminos(true)} className="underline hover:text-foreground">
            Términos de Uso
          </button>{' '}
          y la{' '}
          <button type="button" onClick={() => setShowPrivacidad(true)} className="underline hover:text-foreground">
            Política de Privacidad
          </button>
          .
        </p>
      </div>

      <TerminosUso open={showTerminos} onOpenChange={setShowTerminos} />
      <PoliticaPrivacidad open={showPrivacidad} onOpenChange={setShowPrivacidad} />
    </div>
  )
}
