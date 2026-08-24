import { create } from 'zustand'

// Publica lo último que la docente ha editado (una nota, una semana de
// planificación) para que el asistente de IA pueda ofrecer incluirlo como
// contexto sin que la docente tenga que pegarlo a mano en el chat — ver
// AsistenteChat.tsx ("Incluir lo que has editado").
//
// Deliberadamente NO se limpia al cerrar el editor: NotaEditor/SemanaEditor
// se abren siempre dentro de un Dialog modal (ver NotasList.tsx/
// CalendarioMensual.tsx), que bloquea el resto de la app por debajo —
// incluido el botón flotante del asistente — mientras está abierto. Si el
// contexto se borrara al cerrar el editor, la docente nunca podría llegar a
// usarlo (cerrar el editor para poder abrir el asistente ya lo habría
// borrado). En su lugar, el contexto persiste como "lo último editado en
// este módulo" hasta que se sobrescribe con otra nota/semana con contenido
// — el título en la propia casilla dice siempre a qué corresponde, así que
// nunca es un contexto oculto o sorprendente.
//
// Deliberadamente NO es automático tampoco: el asistente solo lo manda si
// la docente marca la casilla al enviar un mensaje (ver AsistenteChat.tsx),
// igual que se decidió en V1 que el asistente "no lee la pantalla
// automáticamente".
export type ModuloConContexto = 'notas' | 'planificacion'

interface EditorContextState {
  modulo: ModuloConContexto | null
  titulo: string
  texto: string
  publicar: (modulo: ModuloConContexto, titulo: string, texto: string) => void
}

export const useEditorContextStore = create<EditorContextState>((set) => ({
  modulo: null,
  titulo: '',
  texto: '',
  publicar: (modulo, titulo, texto) => set({ modulo, titulo, texto }),
}))
