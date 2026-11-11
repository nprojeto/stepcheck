export type Toast = { id: number; tipo: 'ok' | 'erro' | 'info'; texto: string }
let seq = 0
export function useToasts() { return useState<Toast[]>('toasts', () => []) }
export function toast(texto: string, tipo: Toast['tipo'] = 'ok', ms = 4500) {
  const list = useToasts()
  const id = ++seq
  list.value = [...list.value, { id, tipo, texto }]
  setTimeout(() => { list.value = list.value.filter((t) => t.id !== id) }, ms)
}
export const toastErro = (e: any) => toast(e?.message ?? String(e), 'erro', 7000)
