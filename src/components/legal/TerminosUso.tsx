import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface TerminosUsoProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TerminosUso({ open, onOpenChange }: TerminosUsoProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Términos de Uso</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4 text-left">
          <p className="text-xs bg-muted rounded-lg p-3 text-foreground">
            Última actualización: agosto de 2026. Este documento es un borrador redactado para el
            periodo de pruebas de Docenza y está pendiente de revisión por un profesional legal
            antes de un lanzamiento comercial.
          </p>

          <section>
            <h3 className="font-semibold text-foreground mb-1">1. Objeto</h3>
            <p>
              Estos términos regulan el uso de Docenza, una aplicación web para la planificación
              docente desarrollada por Appstracta (appstracta.app, contacto:{' '}
              <a href="mailto:contact@appstracta.app" className="text-primary underline">
                contact@appstracta.app
              </a>
              ). Al registrarte, aceptas estos términos y la Política de Privacidad.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Descripción del servicio</h3>
            <p>
              Docenza permite gestionar horarios, planificación semanal, reuniones y notas, con
              sincronización entre dispositivos y exportación a PDF. Algunas funciones (el asistente
              de IA, y crear más de un elemento por módulo) requieren una suscripción de pago.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Registro y cuenta</h3>
            <p>
              Para usar Docenza necesitas crear una cuenta con un email real y una contraseña, o
              iniciar sesión con tu cuenta de Google. Eres responsable de mantener la
              confidencialidad de tu contraseña y de toda la actividad que ocurra en tu cuenta.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Prueba gratuita y suscripción</h3>
            <p>
              Toda cuenta nueva incluye una prueba gratuita que permite crear un elemento en cada
              módulo (un horario, una reunión, una nota, una semana de planificación y un evento).
              Superado ese límite, hace falta una suscripción de pago recurrente (anual) para seguir
              creando contenido nuevo y para usar el asistente de IA. La suscripción se renueva
              automáticamente salvo que la canceles. Puedes cancelarla en cualquier momento desde
              "Mi Suscripción" → "Gestionar suscripción", que te lleva al portal de facturación de
              Stripe: seguirás teniendo acceso completo hasta el final del periodo ya pagado, sin
              perder tu cuenta ni tus datos. Alternativamente, eliminar tu cuenta por completo
              (Perfil → Eliminar mi cuenta) también cancela la suscripción, pero de inmediato y
              borrando además todos tus cuadernos de forma irreversible — solo recomendable si
              quieres dejar de usar Docenza del todo. Para cualquier duda, escríbenos a{' '}
              <a href="mailto:contact@appstracta.app" className="text-primary underline">
                contact@appstracta.app
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">5. Derecho de desistimiento</h3>
            <p>
              Como consumidor dentro de la Unión Europea, dispones de 14 días naturales desde la
              contratación de la suscripción para desistir sin coste ni justificación, salvo que
              hayas dado tu consentimiento expreso para empezar a disfrutar del servicio de
              inmediato y hayas sido informado de que, en ese caso, pierdes tu derecho de
              desistimiento una vez el servicio se haya prestado por completo. Para ejercer este
              derecho, escribe a{' '}
              <a href="mailto:contact@appstracta.app" className="text-primary underline">
                contact@appstracta.app
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">6. Tus obligaciones</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proporcionar datos veraces al registrarte y mantener tu perfil actualizado.</li>
              <li>Usar el servicio conforme a la ley y no introducir contenido ilícito.</li>
              <li>
                Si introduces datos de terceros (asistentes a reuniones, referencias a alumnado en
                tus notas...), asegurarte de tener base legal suficiente para hacerlo — ver la
                sección correspondiente de la Política de Privacidad.
              </li>
              <li>No intentar vulnerar la seguridad de la aplicación o acceder a cuentas ajenas.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">7. Propiedad intelectual</h3>
            <p>
              El contenido que creas en Docenza (tus horarios, notas, reuniones...) es tuyo. El
              software, diseño y marca de Docenza son propiedad de Appstracta.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">8. Disponibilidad y responsabilidad</h3>
            <p>
              Trabajamos para que el servicio esté disponible de forma continua, pero no podemos
              garantizarlo al 100% (mantenimiento, incidencias de terceros proveedores, etc.).
              Docenza guarda tus datos también en tu propio dispositivo para que puedas seguir
              trabajando sin conexión, pero te recomendamos exportar copias de seguridad periódicas
              desde el menú Exportar. En la medida permitida por la ley, no seremos responsables de
              pérdidas indirectas derivadas del uso del servicio.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">9. Modificación de estos términos</h3>
            <p>
              Podemos actualizar estos términos para reflejar cambios en el servicio. Te avisaremos
              de cambios relevantes dentro de la propia aplicación.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">10. Legislación aplicable</h3>
            <p>
              Estos términos se rigen por la legislación española. Para cualquier controversia, las
              partes se someten a los juzgados y tribunales que correspondan según la normativa de
              protección de personas consumidoras aplicable.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
