/** Projeto aberto no momento (dados, equipe, módulos, etapas e permissões). */
export function useProjeto() {
  return useState<any | null>('projetoAtual', () => null)
}

export async function carregarProjeto(id: string) {
  const p = useProjeto()
  p.value = await api('/projetos/' + id)
  return p.value
}

/** Caminho dentro do projeto aberto. */
export function rotaProjeto(projectId: string, sub = '') {
  return `/projetos/${projectId}${sub ? '/' + sub : ''}`
}
