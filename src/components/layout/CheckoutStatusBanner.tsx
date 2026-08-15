import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2, Clock } from 'lucide-react'
import { cn } from '../../utils/cn'

type Estado = 'esperando' | 'confirmado' | 'timeout' | 'cancelado' | null

export function CheckoutStatusBanner({ estado }: { estado: Estado }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (estado === 'confirmado') {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 6000)
      return () => clearTimeout(t)
    }
    setVisible(estado !== null && estado !== 'cancelado')
  }, [estado])

  if (!visible || !estado || estado === 'cancelado') return null

  const config = {
    esperando: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      texto: 'Confirmando tu pago…',
      clase: 'bg-primary/10 text-primary border-primary/20',
    },
    confirmado: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      texto: '¡Pago confirmado! Ya tienes acceso completo a todos los módulos.',
      clase: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-900',
    },
    timeout: {
      icon: <Clock className="w-4 h-4" />,
      texto: 'Tu pago se está procesando, puede tardar un minuto. Recarga la página en breve.',
      clase: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900',
    },
  }[estado]

  return (
    <div className={cn('mx-4 md:mx-6 mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm', config.clase)}>
      {config.icon}
      {config.texto}
    </div>
  )
}
