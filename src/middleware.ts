import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Este middleware será executado para as rotas definidas no 'matcher'
export function middleware(request: NextRequest) {
  // 1. Tenta obter o token de autenticação dos cookies da requisição
  const token = request.cookies.get('authToken')?.value;

  // 2. Se não houver token, redireciona o usuário para a página de login
  if (!token) {
    // Constrói a URL de login baseada na URL atual da requisição
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Se o token existir, permite que a requisição continue para a página solicitada
  return NextResponse.next();
}

// O 'matcher' define quais rotas serão protegidas por este middleware.
export const config = {
  matcher: [
    /*
     * Protege a página inicial ('/') e evita que o middleware
     * seja executado em rotas de API, arquivos estáticos (_next/static),
     * arquivos de imagem (_next/image) e no favicon.ico.
     */
    '/',
  ],
};