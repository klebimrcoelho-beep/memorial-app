/**
 * ================================================================
 * RECORDARE — Memorial Template — data.js
 * ================================================================
 * OBJETIVO: Este arquivo simula o "banco de dados" do homenageado.
 * Agora estruturado como um objeto onde a chave é o ID (simulando
 * o acesso direto a um registro).
 * ================================================================
 */

const MEMORIAL_DB = {
  "cliente-1": {
    id: "cliente-1",
    nome: "Maria das Graças Silva",
    apelido: "Graça",
    nascimento: "12/03/1948",
    falecimento: "07/09/2024",
    epitafio: "Aqueles que amamos nunca partem de verdade; eles caminham ao nosso lado a cada passo, e vivem em cada sorriso que deixaram como herança.",
    foto: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&auto=format",
    bio: [
      "Maria das Graças Silva nasceu em 12 de março de 1948, numa manhã de sol no interior de Minas Gerais. Filha de agricultores humildes e trabalhadores, cresceu aprendendo que o amor e a dedicação são o maior patrimônio que uma pessoa pode ter.",
      "Aos 22 anos, mudou-se para São Paulo em busca de novas oportunidades, onde conheceu seu grande amor, José Antônio. Juntos, construíram uma família linda, cheia de risadas, histórias e muitos domingos ao redor de uma grande mesa.",
      "Partiu em paz, cercada de amor, deixando para trás um vazio imenso — e ao mesmo tempo, uma herança riquíssima: ensinamentos, memórias e a certeza de que uma vida bem vivida não se mede em anos, mas na profundidade das marcas que deixamos no coração dos outros."
    ],
    galeria: [
      { url: "https://images.unsplash.com/photo-1490750967868-88df5691cc0a?w=600&h=600&fit=crop&auto=format", legenda: "No jardim que tanto amava" },
      { url: "https://images.unsplash.com/photo-1510771463146-e89e6e86560e?w=600&h=600&fit=crop&auto=format", legenda: "Tarde em família" }
    ],
    video: "",
    audio: "",
    spotify: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh",
    youtube: ""
  },
  
  "cliente-2": {
    id: "cliente-2",
    nome: "João Batista Costa",
    apelido: "Seu João",
    nascimento: "05/11/1950",
    falecimento: "20/01/2025",
    epitafio: "A vida é uma jornada bonita, e a minha foi cheia de sorrisos e boas amizades. Não chorem por mim, celebrem o tempo que tivemos.",
    foto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&auto=format",
    bio: [
      "João Batista, carinhosamente conhecido como Seu João, sempre foi reconhecido por sua alegria contagiante. Trabalhou a vida inteira como mecânico, consertando não só carros, mas também os corações de quem parava para conversar com ele.",
      "Amante do bom samba e de um churrasco aos domingos, reuniu muitos amigos ao longo de sua trajetória. Para ele, a maior riqueza de um homem não estava no bolso, mas na quantidade de pessoas que ele podia chamar de amigo.",
      "Deixa filhos, netos e uma saudade imensa em toda a comunidade."
    ],
    galeria: [
      { url: "https://images.unsplash.com/photo-1533227268428-f9ed0900f953?w=600&h=600&fit=crop&auto=format", legenda: "Churrasco de domingo" },
      { url: "https://images.unsplash.com/photo-1492305175278-3b3afaa251f9?w=600&h=600&fit=crop&auto=format", legenda: "Sempre ajudando" }
    ],
    video: "https://www.w3schools.com/html/mov_bbb.mp4", // Exemplo genérico
    audio: "",
    spotify: "",
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
};
