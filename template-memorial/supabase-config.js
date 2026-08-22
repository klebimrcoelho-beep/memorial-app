/**
 * ================================================================
 * RECORDARE — Memorial Template — supabase-config.js
 * ================================================================
 * CONFIGURAÇÃO DO SUPABASE
 *
 * ⚠️  INSTRUÇÕES DE CONFIGURAÇÃO:
 *
 *  1. Acesse https://supabase.com e faça login no seu projeto.
 *
 *  2. Vá em: Settings → API
 *     - Copie a "Project URL" e cole em SUPABASE_URL abaixo.
 *     - Copie a "anon (public)" key e cole em SUPABASE_ANON_KEY.
 *
 *  3. A anon key é SEGURA para uso no front-end.
 *     Ela só permite operações que o Row Level Security (RLS) permitir.
 *
 *  4. Antes de ir para produção, ative o RLS na tabela 'memoriais'
 *     e crie uma política (policy) de SELECT público:
 *
 *     CREATE POLICY "Permitir leitura pública dos memoriais"
 *       ON memoriais FOR SELECT
 *       USING (true);
 *
 * ================================================================
 */

// ┌──────────────────────────────────────────────────────────────┐
// │  🔑  INSIRA SUAS CHAVES AQUI                                │
// └──────────────────────────────────────────────────────────────┘
const SUPABASE_URL      = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_PUBLICA_AQUI';

// Validação: avisa no console se as chaves ainda não foram configuradas
if (SUPABASE_URL.includes('SEU-PROJETO') || SUPABASE_ANON_KEY.includes('SUA_CHAVE')) {
  console.warn(
    '[Recordare] ⚠️  Chaves do Supabase não configuradas!\n' +
    'Abra o arquivo supabase-config.js e insira a URL e a anon key do seu projeto.\n' +
    'Enquanto isso, o app usará os dados locais de fallback (data.js).'
  );
}
