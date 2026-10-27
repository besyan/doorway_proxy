export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 1. Отдаем файл верификации Google
    if (url.pathname === '/google917fded4ea1463df.html') {
      return new Response('google-site-verification: google917fded4ea1463df.html', {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // 2. Отдаем robots.txt
    if (url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\n', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // 3. Проксирование
    let targetHostAndPath = url.pathname.substring(1);

    if (!targetHostAndPath) {
      return new Response('Использование: https://ваш-домен.workers.dev/example.com/path', {
        status: 400,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    if (targetHostAndPath.startsWith('https://')) {
      targetHostAndPath = targetHostAndPath.substring(8);
    } else if (targetHostAndPath.startsWith('http://')) {
      targetHostAndPath = targetHostAndPath.substring(7);
    }

    const targetUrl = 'https://' + targetHostAndPath;

    try {
      const newHeaders = new Headers();
      
      // Заголовки Googlebot
      newHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
      newHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
      newHeaders.set('Accept-Language', 'en-US,en;q=0.9');
      newHeaders.set('Accept-Encoding', 'gzip, deflate, br');
      newHeaders.set('Connection', 'keep-alive');
      
      // 👇 ДОБАВЛЕННЫЕ ЗАГОЛОВКИ ДЛЯ МАСКИРОВКИ
      newHeaders.set('Referer', 'https://www.google.com/'); 
      // Некоторые системы проверяют этот заголовок, чтобы понять, что запрос пришел с "правильного" хоста
      newHeaders.set('X-Forwarded-Host', 'www.google.com'); 

      // Делаем запрос
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: newHeaders,
        redirect: 'follow',
      });

      // Возвращаем ответ
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
