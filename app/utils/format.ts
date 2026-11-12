export const STATUS: Record<string, { label: string; cor: string; bg: string; curto: string }> = {
  em_elaboracao: { label: 'Em elaboração', curto: 'Elaboração', cor: 'var(--st-elab)', bg: 'var(--st-elab-bg)' },
  disponibilizado: { label: 'Disponibilizado para teste', curto: 'Disponível', cor: 'var(--st-disp)', bg: 'var(--st-disp-bg)' },
  em_execucao: { label: 'Em execução de teste', curto: 'Em teste', cor: 'var(--st-exec)', bg: 'var(--st-exec-bg)' },
  aguardando_aprovacao: { label: 'Aguardando aprovação', curto: 'Aguard. aprovação', cor: 'var(--st-aguard)', bg: 'var(--st-aguard-bg)' },
  reprovado: { label: 'Reprovado', curto: 'Reprovado', cor: 'var(--st-reprov)', bg: 'var(--st-reprov-bg)' },
  em_correcao: { label: 'Em correção', curto: 'Em correção', cor: 'var(--st-corr)', bg: 'var(--st-corr-bg)' },
  aprovado: { label: 'Aprovado', curto: 'Aprovado', cor: 'var(--st-aprov)', bg: 'var(--st-aprov-bg)' },
}
export const STATUS_ORDEM = ['em_elaboracao', 'disponibilizado', 'em_execucao', 'aguardando_aprovacao', 'reprovado', 'em_correcao', 'aprovado']

export const STATUS_PROJETO: Record<string, string> = {
  planejamento: 'Planejamento', em_andamento: 'Em andamento', pausado: 'Pausado', concluido: 'Concluído', cancelado: 'Cancelado',
}
export const PAPEL: Record<string, string> = { administrador: 'Administrador', disponibilizador: 'Disponibilizador', testador: 'Testador', aprovador: 'Aprovador' }
export const RESULTADO: Record<string, string> = { sucesso: 'Sucesso', com_problemas: 'Com problemas' }
export const CRITERIO: Record<string, string> = { ok: 'OK', falhou: 'Falhou', na: 'N/A' }

export function dataHora(v?: string | null) {
  if (!v) return '—'
  const d = new Date(v)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
export function data(v?: string | null) { return v ? new Date(v).toLocaleDateString('pt-BR') : '—' }
export function relativo(v?: string | null) {
  if (!v) return ''
  const s = (Date.now() - new Date(v).getTime()) / 1000
  if (s < 60) return 'agora'
  if (s < 3600) return `há ${Math.floor(s / 60)} min`
  if (s < 86400) return `há ${Math.floor(s / 3600)} h`
  if (s < 86400 * 30) return `há ${Math.floor(s / 86400)} d`
  return data(v)
}
export function duracao(ms?: number | null) {
  if (!ms || ms < 0) return '—'
  const m = Math.floor(ms / 60000)
  if (m < 1) return '< 1 min'
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h ${m % 60} min`
  const d = Math.floor(h / 24)
  return `${d} d ${h % 24} h`
}
export function tamanho(b?: number | null) {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}
export function acaoAuditoria(a: string) {
  if (a.startsWith('status:')) {
    const [, para] = a.slice(7).split('>')
    return 'Status → ' + (STATUS[para]?.label ?? para)
  }
  const mapa: Record<string, string> = {
    criar: 'Criou', editar: 'Editou', excluir: 'Excluiu', arquivar: 'Excluiu (arquivou)', restaurar: 'Restaurou', equipe: 'Alterou a equipe', anexar: 'Anexou arquivo',
    trocar_senha: 'Trocou a senha', redefinir_senha: 'Redefiniu senha', editar_perfil: 'Editou o perfil',
  }
  return mapa[a] ?? a
}
export function senhaProvisoria() {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let s = ''
  const r = crypto.getRandomValues(new Uint32Array(10))
  for (let i = 0; i < 8; i++) s += c[r[i] % c.length]
  return s + '@' + (r[8] % 90 + 10)
}
export function baixarCsv(nome: string, linhas: (string | number | null | undefined)[][]) {
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const csv = '﻿' + linhas.map((l) => l.map(esc).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = nome; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
export function arquivoParaDataUrl(f: File): Promise<string> {
  return new Promise((ok, err) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = err; r.readAsDataURL(f) })
}
