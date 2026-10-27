export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    // Если целевой URL не указан, возвращаем подсказку
    if (!targetUrl) {
      return new Response('Использование: ?url=https://example.com/path', {
        status: 400,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    try {
      // Создаём новый запрос к целевому URL, копируя метод, заголовки и тело
      const targetRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: 'manual', // Важно: не следуем редиректам автоматически, чтобы вернуть их клиенту
      });

      // Удаляем заголовки, которые могут выдать прокси или помешать запросу
      const newHeaders = new Headers(targetRequest.headers);
      newHeaders.delete('host');
      newHeaders.delete('cf-connecting-ip');
      newHeaders.delete('cf-worker');
      // Можно добавить заголовки, имитирующие браузер, если нужно
      // newHeaders.set('User-Agent', 'Mozilla/5.0 ...');

      const modifiedRequest = new Request(targetRequest, {
        headers: newHeaders,
      });

      // Выполняем запрос из сети Cloudflare
      const response = await fetch(modifiedRequest);

      // Возвращаем ответ клиенту, сохраняя статус и заголовки
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
