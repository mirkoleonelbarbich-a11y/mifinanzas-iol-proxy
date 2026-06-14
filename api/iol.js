const IOL_BASE = 'https://api.invertironline.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Falta el parametro path' });
  }

  const allowedPaths = [
    '/token',
    '/api/v2/portafolio/argentina',
    '/api/v2/estadocuenta',
    '/api/v2/operaciones',
  ];

  const isAllowed = allowedPaths.some(p => path.startsWith(p));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Endpoint no permitido' });
  }

  const targetUrl = `${IOL_BASE}${path}`;

  try {
    const iolHeaders = {
      'Content-Type': req.headers['content-type'] || 'application/json',
    };

    if (req.headers.authorization) {
      iolHeaders['Authorization'] = req.headers.authorization;
    }

    let body = undefined;
    if (req.method === 'POST') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body && typeof req.body === 'object') {
        const ct = req.headers['content-type'] || '';
        if (ct.includes('application/x-www-form-urlencoded')) {
          body = Object.entries(req.body)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        } else {
          body = JSON.stringify(req.body);
        }
      }
    }

    const iolRes = await fetch(targetUrl, {
      method: req.method,
      headers: iolHeaders,
      body,
    });

    const contentType = iolRes.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await iolRes.json();
    } else {
      data = await iolRes.text();
    }

    res.status(iolRes.status);
    if (typeof data === 'object') {
      return res.json(data);
    } else {
      return res.send(data);
    }

  } catch (err) {
    return res.status(502).json({
      error: 'Error al conectar con IOL',
      detail: err.message
    });
  }
}