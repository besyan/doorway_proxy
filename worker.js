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
      // Создаем новые заголовки
      const newHeaders = new Headers();
      
      // Подставляем заголовки Googlebot
      newHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      newHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
      newHeaders.set('Accept-Language', 'en-US,en;q=0.9');
      newHeaders.set('Accept-Encoding', 'gzip, deflate, br');
      newHeaders.set('Connection', 'keep-alive');

      // Делаем запрос. redirect: 'follow' заставит Cloudflare автоматически переходить по редиректам.
      // Заголовки от нашего клиента (браузера) мы НЕ передаем, чтобы не выдать прокси.
      const response = await fetch(targetUrl, {
        method: 'GET', // Для простоты всегда используем GET
        headers: newHeaders,
        redirect: 'follow', // <--- КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
      });

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
