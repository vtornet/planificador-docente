import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'

interface PoliticaPrivacidadProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PoliticaPrivacidad({ open, onOpenChange }: PoliticaPrivacidadProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Política de Privacidad</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4 text-left">
          <p className="text-xs bg-muted rounded-lg p-3 text-foreground">
            Última actualización: agosto de 2026. Este documento es un borrador redactado para el
            periodo de pruebas de Docenza y está pendiente de revisión por un profesional legal
            antes de un lanzamiento comercial.
          </p>

          <section>
            <h3 className="font-semibold text-foreground mb-1">1. Responsable del tratamiento</h3>
            <p>
              Appstracta (appstracta.app) es responsable del tratamiento de los datos personales
              recogidos a través de Docenza. Puedes contactar en{' '}
              <a href="mailto:contact@appstracta.app" className="text-primary underline">
                contact@appstracta.app
              </a>{' '}
              para cualquier consulta relacionada con esta política.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">2. Qué datos recogemos</h3>
            <p>Al usar Docenza tratamos estas categorías de datos:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li>
                <strong>Datos de cuenta:</strong> email y contraseña (la contraseña nunca se
                almacena en texto plano, la gestiona nuestro proveedor de autenticación) — o, si
                inicias sesión con Google, el email y el identificador que Google nos facilita para
                ese fin.
              </li>
              <li>
                <strong>Datos de perfil:</strong> centro educativo, nombre del docente, curso
                escolar, comunidad autónoma y cursos/grupos, todos introducidos voluntariamente.
              </li>
              <li>
                <strong>Contenido del cuaderno:</strong> horarios, planificación semanal, reuniones
                (incluidas firmas digitales si las añades) y notas que crees en la aplicación.
              </li>
              <li>
                <strong>Datos de pago:</strong> los gestiona directamente Stripe; nosotros no
                almacenamos los datos de tu tarjeta.
              </li>
              <li>
                <strong>Mensajes al asistente de IA:</strong> el texto que escribes al asistente se
                envía a un proveedor externo para generar la respuesta (ver sección 4).
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">3. Finalidad y base legal</h3>
            <p>
              Tratamos tus datos para prestarte el servicio (crear tu cuenta, guardar y sincronizar
              tu cuaderno entre dispositivos, gestionar tu suscripción) en base a la ejecución del
              contrato de uso de Docenza. Los datos de facturación se tratan además para cumplir
              obligaciones legales fiscales.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">4. Con quién compartimos tus datos</h3>
            <p>No vendemos tus datos. Los compartimos únicamente con los proveedores que necesitamos para operar el servicio, actuando como encargados del tratamiento:</p>
            <ul className="list-disc pl-5 space-y-1 mt-1">
              <li><strong>Supabase</strong> — alojamiento de la base de datos y autenticación.</li>
              <li><strong>Stripe</strong> — procesamiento de pagos de la suscripción.</li>
              <li><strong>Resend</strong> — envío de emails de la cuenta (confirmación, recuperación de contraseña).</li>
              <li><strong>Groq</strong> — genera las respuestas del asistente de IA cuando lo usas; solo recibe el texto que escribes en esa conversación, no el resto de tu cuaderno.</li>
              <li><strong>Google</strong> — si eliges iniciar sesión con tu cuenta de Google, actúa como proveedor de identidad para ese inicio de sesión.</li>
            </ul>
            <p className="mt-1">
              Algunos de estos proveedores pueden procesar datos fuera del Espacio Económico
              Europeo; en ese caso se apoyan en las garantías previstas por el RGPD (cláusulas
              contractuales tipo u otros mecanismos equivalentes).
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">5. Cuánto tiempo conservamos tus datos</h3>
            <p>
              Mientras tu cuenta esté activa. Puedes eliminar tu cuenta tú misma en cualquier
              momento desde Perfil → Eliminar mi cuenta: se cancela de inmediato tu suscripción si
              tienes una, y se borran tu cuenta y todos tus cuadernos, tanto en la nube como en el
              dispositivo desde el que lo pidas — de forma inmediata e irreversible. También puedes
              escribirnos a{' '}
              <a href="mailto:contact@appstracta.app" className="text-primary underline">
                contact@appstracta.app
              </a>{' '}
              si lo prefieres así. Aparte de eso, puedes exportar y borrar tus datos por tu cuenta
              desde la app en cualquier momento (backup JSON y borrado de horarios, reuniones o
              notas de forma individual).
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">6. Tus derechos</h3>
            <p>
              Puedes solicitar en cualquier momento el acceso, rectificación, supresión,
              portabilidad, limitación u oposición al tratamiento de tus datos, escribiendo a{' '}
              <a href="mailto:contact@appstracta.app" className="text-primary underline">
                contact@appstracta.app
              </a>
              . También tienes derecho a presentar una reclamación ante la Agencia Española de
              Protección de Datos (aepd.es) si consideras que no hemos atendido tu solicitud
              correctamente.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">7. Datos de terceros que introduces tú</h3>
            <p>
              Docenza te permite anotar información sobre otras personas (por ejemplo, asistentes a
              una reunión, o referencias a alumnado en tus notas). Al introducir esos datos, tú
              actúas como responsable de ese tratamiento y debes contar con base legal suficiente
              (normalmente, tu propio interés legítimo o función docente) para hacerlo — Appstracta
              solo actúa como encargado técnico que aloja esa información en tu nombre.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">8. Seguridad</h3>
            <p>
              Aplicamos medidas técnicas razonables (cifrado en tránsito, control de acceso por
              cuenta) para proteger tus datos, tanto en el almacenamiento local de tu dispositivo
              como en los servidores de nuestros proveedores.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground mb-1">9. Cambios en esta política</h3>
            <p>
              Podemos actualizar esta política para reflejar cambios en el servicio o en la
              normativa aplicable. Te avisaremos de cambios relevantes dentro de la propia
              aplicación.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
