export type PaginacaoMeta = {
  total: number
  pagina: number
  por_pagina: number
  total_paginas: number
}

export function paginacao(total: number, pagina: number, porPagina: number): PaginacaoMeta {
  return {
    total,
    pagina,
    por_pagina: porPagina,
    total_paginas: Math.ceil(total / porPagina),
  }
}