export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
      return new Response('Использование: ?url=https://example.com/path', {
        status: 400,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    try {
      // Создаем новые заголовки на основе исходных
      const newHeaders = new Headers(request.headers);
      
      // 1. Удаляем заголовки, которые могут выдать прокси
      newHeaders.delete('host');
      newHeaders.delete('cf-connecting-ip');
      newHeaders.delete('cf-worker');
      newHeaders.delete('x-forwarded-for');
      newHeaders.delete('x-real-ip');

      // 2. ПОДСТАВЛЯЕМ ЗАГОЛОВКИ GOOGLEBOT
      // Ваш User-Agent для мобильного Googlebot (Nexus 5X)
      newHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      
      // Ваш Accept-заголовок (клоака проверяет наличие text/html)
      newHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
      
      // Дополнительные заголовки, которые часто проверяют клоаки
      newHeaders.set('Accept-Language', 'en-US,en;q=0.9');
      newHeaders.set('Accept-Encoding', 'gzip, deflate, br');
      newHeaders.set('Connection', 'keep-alive');
      
      // Создаем новый запрос с подмененными заголовками
      const targetRequest = new Request(targetUrl, {
        method: request.method,
        headers: newHeaders,
        body: request.body,
        redirect: 'manual',
      });

      // Выполняем запрос из сети Cloudflare
      const response = await fetch(targetRequest);

      // Возвращаем ответ клиенту
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } catch (error) {
      return new Response(`Ошибка прокси: ${error.message}`, {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  },
};
