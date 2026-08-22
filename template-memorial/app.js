/**
 * ================================================================
 * RECORDARE — Memorial Template — app.js
 * ================================================================
 * RESPONSABILIDADES:
 *  1. Extrair o ID/slug do homenageado da URL
 *     (aceita ?id=slug OU /homenagem/slug)
 *  2. Buscar os dados no Supabase via SDK
 *  3. Fallback automático para data.js local se Supabase indisponível
 *  4. Popular o HTML dinamicamente
 *  5. Gerenciar o Lightbox (galeria modal)
 *  6. Controlar animações de fade-in via IntersectionObserver
 *  7. Controlar Loading Screen e tela de erro
 *
 * DEPENDÊNCIAS (carregadas antes deste script no HTML):
 *  - supabase-config.js  → SUPABASE_URL, SUPABASE_ANON_KEY
 *  - data.js             → MEMORIAL_DB (fallback local)
 *  - Supabase CDN SDK    → window.supabase
 * ================================================================
 */

'use strict';

/* ── Estado do Lightbox ──────────────────────────────────────── */
const lightboxState = {
  currentIndex: 0,
  images: []
};


/* ================================================================
   1. EXTRAÇÃO DO ID DA URL
   ----------------------------------------------------------------
   Aceita dois formatos de rota:
     • Query param:  /index.html?id=joao-silva
     • Path-based:   /homenagem/joao-silva
   Retorna o slug (string) ou null se não encontrar.
================================================================ */
function extractMemorialId() {
  // Formato 1: Query parameter → ?id=joao-silva
  const urlParams = new URLSearchParams(window.location.search);
  const queryId = urlParams.get('id');
  if (queryId && queryId.trim() !== '') {
    return queryId.trim();
  }

  // Formato 2: Path-based → /homenagem/joao-silva
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  // Procura pelo segmento "homenagem" e pega o próximo como o slug
  const homenagemIndex = pathParts.indexOf('homenagem');
  if (homenagemIndex !== -1 && pathParts[homenagemIndex + 1]) {
    return pathParts[homenagemIndex + 1].trim();
  }

  return null;
}


/* ================================================================
   2. BUSCA DE DADOS — SUPABASE + FALLBACK LOCAL
   ----------------------------------------------------------------
   Tenta buscar no Supabase. Se falhar (chaves não configuradas,
   rede offline, etc.), cai automaticamente no MEMORIAL_DB local.
================================================================ */

/**
 * Inicializa o cliente Supabase.
 * Retorna o client ou null se as chaves não estiverem configuradas.
 */
function createSupabaseClient() {
  // Verifica se a SDK do Supabase foi carregada
  if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
    console.warn('[Recordare] SDK do Supabase não encontrada. Usando dados locais.');
    return null;
  }

  // Verifica se as chaves foram preenchidas
  if (
    typeof SUPABASE_URL === 'undefined' ||
    typeof SUPABASE_ANON_KEY === 'undefined' ||
    SUPABASE_URL.includes('SEU-PROJETO') ||
    SUPABASE_ANON_KEY.includes('SUA_CHAVE')
  ) {
    console.warn('[Recordare] Chaves do Supabase não configuradas. Usando dados locais.');
    return null;
  }

  return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}


/**
 * Busca os dados do memorial no Supabase pela coluna 'id' (slug).
 *
 * Espera que a tabela 'memoriais' tenha a seguinte estrutura:
 * ──────────────────────────────────────────────────────────────
 *  Coluna             │ Tipo          │ Descrição
 * ──────────────────────────────────────────────────────────────
 *  id                 │ TEXT (PK)     │ Slug da URL (ex: joao-silva)
 *  nome_completo      │ TEXT          │ Nome completo
 *  apelido            │ TEXT          │ Apelido carinhoso (opcional)
 *  data_nascimento    │ TEXT          │ DD/MM/AAAA
 *  data_falecimento   │ TEXT          │ DD/MM/AAAA
 *  frase              │ TEXT          │ Epitáfio / frase destaque
 *  biografia          │ TEXT[]        │ Array de parágrafos
 *  foto_perfil_url    │ TEXT          │ URL da foto de perfil
 *  galeria_urls       │ JSONB         │ Array de { url, legenda }
 *  video_url          │ TEXT          │ URL do vídeo (opcional)
 *  audio_url          │ TEXT          │ URL do áudio (opcional)
 *  spotify_url        │ TEXT          │ Link do Spotify (opcional)
 *  youtube_url        │ TEXT          │ Link do YouTube (opcional)
 *  criado_em          │ TIMESTAMPTZ   │ Data de criação (auto)
 * ──────────────────────────────────────────────────────────────
 *
 * @param {object} supabaseClient - Cliente Supabase inicializado
 * @param {string} slug - ID/slug do memorial
 * @returns {object|null} Dados do memorial ou null
 */
async function fetchFromSupabase(supabaseClient, slug) {
  try {
    const { data, error } = await supabaseClient
      .from('memoriais')
      .select('*')
      .eq('id', slug)
      .single();

    if (error) {
      console.error('[Recordare] Erro na consulta ao Supabase:', error.message);
      return null;
    }

    if (!data) return null;

    // Mapeia os campos do Supabase para o formato esperado pelo front-end
    return mapSupabaseToFrontend(data);

  } catch (err) {
    console.error('[Recordare] Exceção ao acessar Supabase:', err);
    return null;
  }
}


/**
 * Converte os nomes de campos do schema do Supabase (snake_case)
 * para o formato usado pelas funções de render do front-end.
 *
 * Isso garante desacoplamento — se o schema mudar, basta
 * ajustar este mapeamento sem tocar nas funções de render.
 *
 * @param {object} row - Registro cru retornado pelo Supabase
 * @returns {object} Dados no formato do front-end
 */
function mapSupabaseToFrontend(row) {
  // Normaliza galeria_urls: pode ser array de strings ou array de {url, legenda}
  let galeria = [];
  if (row.galeria_urls) {
    let rawGaleria = [];
    if (Array.isArray(row.galeria_urls)) {
      rawGaleria = row.galeria_urls;
    } else if (typeof row.galeria_urls === 'string') {
      try { rawGaleria = JSON.parse(row.galeria_urls); } catch(e) { rawGaleria = []; }
    }

    galeria = rawGaleria.map((item, i) => {
      if (typeof item === 'string') {
        return { url: item, legenda: `Foto ${i + 1}` };
      }
      return { url: item.url || '', legenda: item.legenda || `Foto ${i + 1}` };
    }).filter(item => item.url);
  }

  return {
    id: row.id,
    nome: row.nome_completo || '',
    apelido: row.apelido || '',
    nascimento: row.data_nascimento || '',
    falecimento: row.data_falecimento || '',
    epitafio: row.frase || '',
    foto: row.foto_perfil_url || '',
    bio: row.biografia || [],
    galeria,
    video: row.video_url || '',
    audio: row.audio_url || '',
    spotify: row.spotify_url || '',
    youtube: row.youtube_url || ''
  };
}


/**
 * Busca os dados no fallback local (MEMORIAL_DB de data.js).
 * @param {string} slug - ID/slug do memorial
 * @returns {object|null} Dados do memorial ou null
 */
function fetchFromLocal(slug) {
  if (typeof MEMORIAL_DB !== 'undefined' && MEMORIAL_DB[slug]) {
    console.info(`[Recordare] Dados carregados do banco local para: ${slug}`);
    return MEMORIAL_DB[slug];
  }
  return null;
}


/* ================================================================
   3. PONTO DE ENTRADA PRINCIPAL
================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initApp, 600);
});


/**
 * Orquestra todo o fluxo de inicialização:
 *  1. Extrai o ID da URL
 *  2. Tenta Supabase → fallback local
 *  3. Popula ou exibe erro
 */
async function initApp() {
  try {
    // ── 1. Extrai o slug da URL ──────────────────────────────
    const slug = extractMemorialId();

    if (!slug) {
      console.warn('[Recordare] Nenhum ID encontrado na URL.');
      showNotFound();
      return;
    }

    console.info(`[Recordare] ID extraído da URL: "${slug}"`);

    // ── 2. Busca os dados (Supabase → fallback local) ────────
    let data = null;

    // Tenta Supabase primeiro
    const supabaseClient = createSupabaseClient();
    if (supabaseClient) {
      console.info('[Recordare] Tentando buscar no Supabase...');
      data = await fetchFromSupabase(supabaseClient, slug);
      if (data) {
        console.info('[Recordare] ✅ Dados carregados do Supabase com sucesso.');
      }
    }

    // Se Supabase falhou, tenta o banco local
    if (!data) {
      console.info('[Recordare] Tentando fallback local (data.js)...');
      data = fetchFromLocal(slug);
    }

    // Se não encontrou em nenhum lugar
    if (!data) {
      console.warn(`[Recordare] Memorial "${slug}" não encontrado em nenhuma fonte.`);
      showNotFound();
      return;
    }

    // ── 3. Popula a interface ────────────────────────────────
    renderMeta(data);
    renderHero(data);
    renderBio(data);
    renderGallery(data);
    renderMedia(data);

    // ── 4. Inicializa funcionalidades interativas ────────────
    initLightbox();
    initFadeInSections();

    // ── 5. Exibe a página e remove o loading ─────────────────
    showPage();

  } catch (error) {
    console.error('[Recordare] Erro crítico na inicialização:', error);
    showNotFound();
  }
}


/* ================================================================
   4. TELA DE "MEMORIAL NÃO ENCONTRADO"
================================================================ */
function showNotFound() {
  const loadingScreen = document.getElementById('loading-screen');
  const memorialPage = document.getElementById('memorial-page');
  const notFoundScreen = document.getElementById('not-found-screen');

  if (memorialPage) memorialPage.style.display = 'none';

  if (notFoundScreen) {
    notFoundScreen.style.display = 'flex';
  }

  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 800);
  }
}


/* ================================================================
   5. RENDER — Meta Tags e Título
================================================================ */
function renderMeta(data) {
  const titleText = `Em Memória de ${data.nome} | Recordare`;

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titleText;
  document.title = titleText;

  const descEl = document.getElementById('page-description');
  if (descEl) {
    const epitafioPreview = data.epitafio ? data.epitafio.substring(0, 120) : '';
    descEl.setAttribute(
      'content',
      `Homenagem a ${data.nome} (${data.nascimento} – ${data.falecimento}). ${epitafioPreview}...`
    );
  }
}


/* ================================================================
   6. RENDER — Hero Section
================================================================ */
function renderHero(data) {
  const photoEl = document.getElementById('hero-photo');
  if (photoEl) {
    photoEl.src = data.foto || '';
    photoEl.alt = `Foto de ${data.nome}`;
  }

  const nameEl = document.getElementById('hero-name');
  if (nameEl) nameEl.textContent = data.nome;

  const nicknameEl = document.getElementById('hero-nickname');
  if (nicknameEl) {
    if (data.apelido && data.apelido.trim() !== '') {
      nicknameEl.textContent = `"${data.apelido}"`;
      nicknameEl.style.display = 'block';
    } else {
      nicknameEl.style.display = 'none';
    }
  }

  const birthEl = document.getElementById('hero-birth-value');
  if (birthEl) birthEl.textContent = data.nascimento;

  const deathEl = document.getElementById('hero-death-value');
  if (deathEl) deathEl.textContent = data.falecimento;

  const epitaphEl = document.getElementById('hero-epitaph-text');
  if (epitaphEl) epitaphEl.textContent = data.epitafio;
}


/* ================================================================
   7. RENDER — Seção Biografia
================================================================ */
function renderBio(data) {
  const bioContainer = document.getElementById('bio-text');
  if (!bioContainer) return;
  bioContainer.innerHTML = '';

  const paragraphs = Array.isArray(data.bio) ? data.bio : [data.bio];

  paragraphs.forEach(paragraph => {
    if (paragraph && paragraph.trim() !== '') {
      const p = document.createElement('p');
      p.textContent = paragraph;
      bioContainer.appendChild(p);
    }
  });
}


/* ================================================================
   8. RENDER — Galeria de Memórias
================================================================ */
function renderGallery(data) {
  const galleryGrid = document.getElementById('galeria-container');
  if (!galleryGrid) {
    console.error('[Recordare] Elemento #galeria-container não encontrado no DOM.');
    return;
  }

  // Limpa qualquer conteúdo prévio (incluindo <img> fixas remanescentes)
  galleryGrid.innerHTML = '';

  if (!data.galeria || data.galeria.length === 0) {
    console.info('[Recordare] Nenhuma foto na galeria. Ocultando seção.');
    const gallerySection = document.getElementById('secao-galeria');
    if (gallerySection) gallerySection.style.display = 'none';

    const dividerGaleria = document.getElementById('divider-galeria');
    if (dividerGaleria) dividerGaleria.style.display = 'none';
    return;
  }

  console.info(`[Recordare] Renderizando galeria com ${data.galeria.length} foto(s).`);

  lightboxState.images = data.galeria;

  data.galeria.forEach((foto, index) => {
    const item = document.createElement('li');
    item.className = 'gallery-item';
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Foto ${index + 1}: ${foto.legenda || ''}`);

    const img = document.createElement('img');
    img.src = foto.url;
    img.alt = foto.legenda || `Foto ${index + 1}`;
    img.loading = 'lazy';

    // Tratamento de erro de carregamento da imagem
    img.onerror = function() {
      console.warn(`[Recordare] Falha ao carregar imagem ${index + 1}: ${foto.url}`);
      this.style.opacity = '0.3';
    };

    item.appendChild(img);
    galleryGrid.appendChild(item);

    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });
}


/* ================================================================
   9. RENDER — Seção Mídia
================================================================ */
function renderMedia(data) {
  let hasAnyMedia = false;

  // ── Vídeo ──
  if (data.video && data.video.trim() !== '') {
    const videoSource = document.getElementById('video-source');
    const videoContainer = document.getElementById('video-container');
    const videoEl = document.getElementById('memorial-video');
    if (videoSource && videoContainer && videoEl) {
      videoSource.src = data.video;
      videoEl.load();
      videoContainer.style.display = 'block';
      hasAnyMedia = true;
    }
  }

  // ── Áudio ──
  if (data.audio && data.audio.trim() !== '') {
    const audioSource = document.getElementById('audio-source');
    const audioContainer = document.getElementById('audio-container');
    const audioEl = document.getElementById('memorial-audio');
    if (audioSource && audioContainer && audioEl) {
      audioSource.src = data.audio;
      audioEl.load();
      audioContainer.style.display = 'block';
      hasAnyMedia = true;
    }
  }

  // ── Botões de música ──
  const musicButtonsContainer = document.getElementById('music-buttons');
  let hasMusicButtons = false;

  if (data.spotify && data.spotify.trim() !== '') {
    const spotifyBtn = document.getElementById('spotify-btn');
    if (spotifyBtn) {
      spotifyBtn.href = data.spotify;
      spotifyBtn.style.display = 'flex';
      hasMusicButtons = true;
      hasAnyMedia = true;
    }
  }

  if (data.youtube && data.youtube.trim() !== '') {
    const youtubeBtn = document.getElementById('youtube-btn');
    if (youtubeBtn) {
      youtubeBtn.href = data.youtube;
      youtubeBtn.style.display = 'flex';
      hasMusicButtons = true;
      hasAnyMedia = true;
    }
  }

  if (hasMusicButtons && musicButtonsContainer) {
    musicButtonsContainer.style.display = 'block';
  }

  if (!hasAnyMedia) {
    const mediaSection = document.getElementById('midia');
    if (mediaSection) mediaSection.style.display = 'none';
  }
}


/* ================================================================
   10. LIGHTBOX — Modal de visualização de fotos
================================================================ */
function initLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if (!overlay || !closeBtn || !prevBtn || !nextBtn) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox();
  });

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => navigateLightbox(-1));
  nextBtn.addEventListener('click', () => navigateLightbox(1));

  document.addEventListener('keydown', (e) => {
    if (overlay.style.display === 'none') return;
    switch (e.key) {
      case 'ArrowLeft': navigateLightbox(-1); break;
      case 'ArrowRight': navigateLightbox(1); break;
      case 'Escape': closeLightbox(); break;
    }
  });

  // Suporte a gestos de swipe no mobile
  let touchStartX = 0;
  overlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  overlay.addEventListener('touchend', (e) => {
    const delta = e.changedTouches[0].screenX - touchStartX;
    if (Math.abs(delta) > 50) {
      navigateLightbox(delta > 0 ? -1 : 1);
    }
  });
}

function openLightbox(index) {
  lightboxState.currentIndex = index;
  updateLightboxImage();

  const overlay = document.getElementById('lightbox-overlay');
  if (overlay) overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const closeBtn = document.getElementById('lightbox-close');
  if (closeBtn) closeBtn.focus();
}

function closeLightbox() {
  const overlay = document.getElementById('lightbox-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
}

function navigateLightbox(direction) {
  const total = lightboxState.images.length;
  if (total === 0) return;
  lightboxState.currentIndex = (lightboxState.currentIndex + direction + total) % total;
  updateLightboxImage();
}

function updateLightboxImage() {
  const { images, currentIndex } = lightboxState;
  const foto = images[currentIndex];
  if (!foto) return;

  const imgEl = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');

  if (imgEl) {
    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = foto.url;
      imgEl.alt = foto.legenda || `Foto ${currentIndex + 1}`;
      imgEl.style.opacity = '1';
      imgEl.style.transition = 'opacity 0.3s ease';
    }, 150);
  }

  if (captionEl) {
    captionEl.textContent = foto.legenda
      ? `${foto.legenda} · ${currentIndex + 1} / ${images.length}`
      : `${currentIndex + 1} / ${images.length}`;
  }

  const showNav = images.length > 1;
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  if (prevBtn) prevBtn.style.display = showNav ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = showNav ? 'flex' : 'none';
}


/* ================================================================
   11. ANIMAÇÕES — Fade-In via Intersection Observer
================================================================ */
function initFadeInSections() {
  const sections = document.querySelectorAll('.fade-in-section');
  if (sections.length === 0) return;

  if (!('IntersectionObserver' in window)) {
    sections.forEach(s => s.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    }
  );

  sections.forEach(section => observer.observe(section));
}


/* ================================================================
   12. LOADING SCREEN — Controle de exibição
================================================================ */
function showPage() {
  const loadingScreen = document.getElementById('loading-screen');
  const memorialPage = document.getElementById('memorial-page');

  if (memorialPage) memorialPage.style.display = 'block';

  if (loadingScreen) {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 800);
  }
}
