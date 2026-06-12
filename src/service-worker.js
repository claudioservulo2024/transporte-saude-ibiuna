// ============================================
// SERVICE WORKER - Transporte Saúde Ibiúna
// ============================================

const CACHE_NAME = 'transporte-saude-v1'

// Arquivos que ficam salvos offline
const ASSETS_PARA_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// -------- INSTALAR: salva arquivos no cache --------
self.addEventListener('install', event => {
  console.log('[SW] Instalando...')

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Salvando arquivos no cache')
        return cache.addAll(ASSETS_PARA_CACHE)
      })
      .then(() => {
        console.log('[SW] Instalado com sucesso!')
      })
  )

  // Ativa imediatamente sem esperar aba fechar
  self.skipWaiting()
})

// -------- ATIVAR: limpa caches antigos --------
self.addEventListener('activate', event => {
  console.log('[SW] Ativando...')

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME) // caches antigos
          .map(name => {
            console.log('[SW] Removendo cache antigo:', name)
            return caches.delete(name)
          })
      )
    })
  )

  // Assume controle de todas as abas imediatamente
  self.clients.claim()
})

// -------- FETCH: estratégia Network First --------
// Tenta buscar da internet primeiro
// Se falhar (offline), usa o cache
self.addEventListener('fetch', event => {

  // Ignora requisições que não são GET
  if (event.request.method !== 'GET') return

  // Ignora requisições do Supabase (sempre online)
  if (event.request.url.includes('supabase.co')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Salva uma cópia no cache
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => {
        // Se offline, busca no cache
        console.log('[SW] Offline - buscando do cache:', event.request.url)
        return caches.match(event.request).then(cached => {
          if (cached) return cached
          // Se não tem no cache, retorna página principal
          return caches.match('/index.html')
        })
      })
  )
})

// -------- MENSAGENS --------
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
