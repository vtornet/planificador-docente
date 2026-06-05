// Plantillas PDF para exportación del Planificador Docente

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Horario, Semana, Reunion, Nota, CuadernoDocente } from '../types'

// Intentar registrar fuentes (opcional, si no existen usa fuentes por defecto)
try {
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', fontWeight: 400 },
      { src: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Bold.ttf', fontWeight: 700 },
    ],
  })
} catch (e) {
  // Silenciar error si no se pueden cargar las fuentes
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1 solid #000',
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: '5 10',
  },
  table: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 5,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderTop: '1 solid #ddd',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    borderRight: '1 solid #ddd',
    fontSize: 9,
  },
  tableHeader: {
    backgroundColor: '#e0e0e0',
    fontWeight: 'bold',
  },
  text: {
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
  },
})

// ============== HORARIO PDF ==============

interface HorarioPDFProps {
  horario: Horario
  metadata: CuadernoDocente['metadata']
}

export function HorarioPDFDocument({ horario, metadata }: HorarioPDFProps) {
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
  const config = horario.configHorarios

  // Generar horas del día
  const horas: string[] = []
  let horaActual = config.horaInicio
  for (let i = 0; i < config.numPeriodos; i++) {
    horas.push(horaActual)

    // Calcular siguiente hora
    const [h, m] = horaActual.split(':').map(Number)
    const siguiente = new Date(0, 0, 0, h, m + config.duracionPeriodo)
    horaActual = siguiente.toTimeString().slice(0, 5)
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{horario.nombre}</Text>
          <Text style={styles.subtitle}>
            {metadata.centro} · {metadata.cursoEscolar}
          </Text>
          <Text style={styles.subtitle}>
            {horario.tipo === 'docente' ? 'Horario Docente' : 'Horario Alumnado'}
          </Text>
        </View>

        {/* Tabla de horario */}
        <View style={styles.section}>
          <View style={styles.table}>
            {/* Header row */}
            <View style={[styles.tableCell, styles.tableHeader]}><Text>Hora</Text></View>
            {dias.map((dia) => (
              <View key={dia} style={[styles.tableCell, styles.tableHeader]}>
                <Text>{dia}</Text>
              </View>
            ))}
          </View>

          {/* Data rows */}
          {horario.datos.map((fila: CeldaHorario[], idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <View style={styles.tableCell}>
                <Text>{horas[idx]}</Text>
              </View>
              {fila.map((celda, cidx) => (
                <View key={cidx} style={styles.tableCell}>
                  <Text>{celda.contenido || '-'}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generado el {new Date().toLocaleDateString('es-ES')}
        </Text>
      </Page>
    </Document>
  )
}

// ============== REUNIÓN PDF ==============

interface ReunionPDFProps {
  reunion: Reunion
  metadata: CuadernoDocente['metadata']
}

export function ReunionPDFDocument({ reunion, metadata }: ReunionPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{reunion.titulo}</Text>
          <Text style={styles.subtitle}>
            {metadata.centro} · {metadata.cursoEscolar}
          </Text>
          <Text style={styles.subtitle}>
            {new Date(reunion.fecha).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Información de la reunión */}
        <View style={styles.section}>
          <View style={styles.text}>
            <Text style={styles.label}>Tipo:</Text>
            <Text>{reunion.tipo.toUpperCase()}</Text>
          </View>
          <View style={styles.text}>
            <Text style={styles.label}>Asistentes:</Text>
            <Text>{reunion.asistentes.join(', ')}</Text>
          </View>
        </View>

        {/* Asuntos tratados */}
        {reunion.asuntosTratados && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Asuntos Tratados</Text>
            <Text>{reunion.asuntosTratados}</Text>
          </View>
        )}

        {/* Acuerdos */}
        {reunion.acuerdos && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acuerdos</Text>
            <Text>{reunion.acuerdos}</Text>
          </View>
        )}

        {/* Firmas */}
        {reunion.firmas && reunion.firmas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firmas</Text>
            {reunion.firmas.map((firma, idx) => (
              <View key={idx} style={{ marginBottom: 10 }}>
                <Text>{firma.nombre}</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>
                  {new Date(firma.fecha).toLocaleDateString('es-ES')}
                </Text>
                {firma.imagen && firma.imagen.startsWith('data:') && (
                  <Image
                    src={firma.imagen}
                    style={{ width: 100, height: 50, marginTop: 5 }}
                  />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generado el {new Date().toLocaleDateString('es-ES')}
        </Text>
      </Page>
    </Document>
  )
}

// ============== NOTAS PDF ==============

interface NotasPDFProps {
  notas: Nota[]
  metadata: CuadernoDocente['metadata']
}

export function NotasPDFDocument({ notas, metadata }: NotasPDFProps) {
  return (
    <Document>
      {notas.map((nota, idx) => (
        <Page key={nota.id} size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{nota.titulo}</Text>
            <Text style={styles.subtitle}>
              {metadata.centro} · {metadata.cursoEscolar}
            </Text>
            <Text style={styles.subtitle}>
              Categoría: {nota.categoria}
            </Text>
          </View>

          {/* Contenido */}
          <View style={styles.section}>
            {/* Nota: El contenido HTML se simplifica a texto plano */}
            <Text>{nota.contenido.replace(/<[^>]+>/g, '')}</Text>
          </View>

          {/* Tags */}
          {nota.tags && nota.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Etiquetas:</Text>
              <Text>{nota.tags.join(', ')}</Text>
            </View>
          )}

          {/* Footer */}
          <Text style={styles.footer}>
            Actualizada el {new Date(nota.actualizado).toLocaleDateString('es-ES')}
          </Text>
        </Page>
      ))}
    </Document>
  )
}

// ============== CALENDARIO/SEMANA PDF ==============

interface SemanaPDFProps {
  semana: Semana
  metadata: CuadernoDocente['metadata']
}

export function SemanaPDFDocument({ semana, metadata }: SemanaPDFProps) {
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Semana {semana.numeroSemana}</Text>
          <Text style={styles.subtitle}>
            {metadata.centro} · {metadata.cursoEscolar}
          </Text>
          <Text style={styles.subtitle}>
            {new Date(semana.fechaInicio).toLocaleDateString('es-ES')} - {' '}
            {new Date(semana.fechaFin).toLocaleDateString('es-ES')}
          </Text>
        </View>

        {/* Días de la semana */}
        {semana.dias.map((dia, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {diasSemana[idx]} {new Date(dia.fecha).toLocaleDateString('es-ES')}
            </Text>
            {dia.esFestivo && <Text style={{ color: '#d00' }}>Festivo</Text>}
            {dia.esVacaciones && <Text style={{ color: '#d00' }}>Vacaciones</Text>}
            {!dia.esFestivo && !dia.esVacaciones && (
              <View>
                {dia.periodos.map((periodo, pidx) => (
                  <View key={pidx} style={{ marginBottom: 5 }}>
                    <Text style={{ fontSize: 8, fontWeight: 'bold' }}>
                      Periodo {pidx + 1}: {periodo.contenido || '-'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Observaciones */}
        {semana.observaciones && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observaciones</Text>
            <Text>{semana.observaciones}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generado el {new Date().toLocaleDateString('es-ES')}
        </Text>
      </Page>
    </Document>
  )
}

// ============== CUADERNO COMPLETO PDF ==============

interface CuadernoCompletoPDFProps {
  cuaderno: CuadernoDocente
}

export function CuadernoCompletoPDF({ cuaderno }: CuadernoCompletoPDFProps) {
  return (
    <Document>
      {/* Portada */}
      <Page size="A4" style={styles.page}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={[styles.title, { fontSize: 32, marginBottom: 20 }]}>
            Planificación Docente
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>
            {cuaderno.metadata.centro}
          </Text>
          <Text style={{ fontSize: 14, marginBottom: 30 }}>
            Curso {cuaderno.metadata.cursoEscolar}
          </Text>
          <Text style={{ fontSize: 12 }}>
            Docente: {cuaderno.metadata.docente}
          </Text>
        </View>
        <Text style={styles.footer}>
          Generado el {new Date().toLocaleDateString('es-ES')}
        </Text>
      </Page>

      {/* Índice */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Índice</Text>
        <View style={{ marginTop: 20 }}>
          <Text style={styles.text}>1. Horarios ({cuaderno.horarios.length})</Text>
          <Text style={styles.text}>2. Planificación ({cuaderno.planificacion.semanal.length} semanas)</Text>
          <Text style={styles.text}>3. Reuniones ({cuaderno.reuniones.length})</Text>
          <Text style={styles.text}>4. Notas ({cuaderno.notas.length})</Text>
        </View>
      </Page>

      {/* Horarios */}
      {cuaderno.horarios.map((horario) => (
        <HorarioPDFDocument key={horario.id} horario={horario} metadata={cuaderno.metadata} />
      ))}

      {/* Planificación (primeras semanas) */}
      {cuaderno.planificacion.semanal.slice(0, 5).map((semana) => (
        <SemanaPDFDocument key={semana.id} semana={semana} metadata={cuaderno.metadata} />
      ))}

      {/* Reuniones */}
      {cuaderno.reuniones.map((reunion) => (
        <ReunionPDFDocument key={reunion.id} reunion={reunion} metadata={cuaderno.metadata} />
      ))}

      {/* Notas */}
      {cuaderno.notas.length > 0 && (
        <NotasPDFDocument notas={cuaderno.notas} metadata={cuaderno.metadata} />
      )}
    </Document>
  )
}
