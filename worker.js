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
      // Функция для выполнения запроса с возможностью следования редиректам
      async function fetchWithRedirects(target, maxRedirects = 5) {
        let currentUrl = target;
        let currentRequest = new Request(currentUrl, {
          method: request.method,
          headers: request.headers,
          body: request.body,
          redirect: 'manual', // Мы сами управляем редиректами
        });

        for (let i = 0; i < maxRedirects; i++) {
          const newHeaders = new Headers(currentRequest.headers);
          
          // Удаляем заголовки, выдающие прокси
          newHeaders.delete('host');
          newHeaders.delete('cf-connecting-ip');
          newHeaders.delete('cf-worker');
          newHeaders.delete('x-forwarded-for');
          newHeaders.delete('x-real-ip');

          // Подставляем заголовки Googlebot
          newHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
          newHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
          newHeaders.set('Accept-Language', 'en-US,en;q=0.9');
          newHeaders.set('Accept-Encoding', 'gzip, deflate, br');
          newHeaders.set('Connection', 'keep-alive');

          const modifiedRequest = new Request(currentUrl, {
            method: currentRequest.method,
            headers: newHeaders,
            body: currentRequest.body,
            redirect: 'manual',
          });

          const response = await fetch(modifiedRequest);

          // Если это редирект (301, 302, 303, 307, 308)
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('Location');
            if (location) {
              // Формируем новый абсолютный URL для следующего запроса
              currentUrl = new URL(location, currentUrl).toString();
              // Обновляем метод и тело для следующего запроса (обычно GET)
              currentRequest = new Request(currentUrl, {
                method: 'GET', // При редиректе обычно переходим на GET
                headers: newHeaders,
                redirect: 'manual',
              });
              continue; // Переходим к следующей итерации цикла
            }
          }

          // Если это не редирект, возвращаем ответ
          // Важно: переписываем заголовок Location, если он есть, чтобы браузер не ушел с прокси
          const responseHeaders = new Headers(response.headers);
          if (responseHeaders.has('Location')) {
            const originalLocation = responseHeaders.get('Location');
            const absoluteLocation = new URL(originalLocation, currentUrl).toString();
            // Подменяем Location на наш прокси-адрес
            const proxyLocation = `${url.origin}/?url=${encodeURIComponent(absoluteLocation)}`;
            responseHeaders.set('Location', proxyLocation);
          }

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          });
        }

        // Если превышено максимальное количество редиректов
        return new Response('Слишком много редиректов', { status: 508 });
      }

      return await fetchWithRedirects(targetUrl);

    } catch (error) {
      return new Response(`Ошибка прокси: ${error.message}`, {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }
  },
};
