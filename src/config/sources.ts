import type { Source } from '@/lib/types'

export const sources: Source[] = [
  {
    id: 'drbna-praha-3',
    name: 'Pražská Drbna - Praha 3',
    url: 'https://prazska.drbna.cz/z-kraje/praha-3.html',
    articleUrlPattern: '^https?://prazska\\.drbna\\.cz/z-kraje/praha-3/[^?#]+\\.html$',
    linkContainerSelectors: ['.col-12.col-md-8.contentMain'],
    maxItems: 30
  },
  {
    id: 'praha-3',
    name: 'Praha 3',
    url: 'https://www.praha3.cz/aktualne-z-trojky/zpravy',
    articleUrlPattern: '^https?://www\\.praha3\\.cz/[^?#]+/?$',
    allowInsecureTls: true,
    linkContainerSelectors: ['.p-content-main'],
    linkSelector: 'a.item-link',
    listPageTemplate: 'https://www.praha3.cz/aktualne-z-trojky/zpravy/page:{page}/',
    maxItems: 120
  },
]
