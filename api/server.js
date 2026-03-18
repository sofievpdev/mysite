const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3001;
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_LIST_ID = parseInt(process.env.BREVO_LIST_ID || '3');
const BREVO_TEMPLATE_ID = parseInt(process.env.BREVO_TEMPLATE_ID || '1');
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://sofievp.com').split(',');

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function brevoRequest(path, body) {
  return new Promise(function(resolve, reject) {
    var data = JSON.stringify(body);
    var options = {
      hostname: 'api.brevo.com',
      path: '/v3' + path,
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-length': Buffer.byteLength(data)
      }
    };
    var req = https.request(options, function(resp) {
      var chunks = [];
      resp.on('data', function(chunk) { chunks.push(chunk); });
      resp.on('end', function() {
        var result = Buffer.concat(chunks).toString();
        try { resolve(JSON.parse(result)); }
        catch(e) { resolve({ raw: result }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

var server = http.createServer(function(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  // Health check
  if (req.url === '/health' && req.method === 'GET') {
    return sendJSON(res, 200, { status: 'ok' });
  }

  // Subscribe endpoint
  if (req.url === '/subscribe' && req.method === 'POST') {
    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);
        var email = data.email;
        var guideLink = data.guide_link;

        if (!email || !email.includes('@')) {
          return sendJSON(res, 400, { error: 'Invalid email' });
        }

        // 1. Add contact to Brevo list
        brevoRequest('/contacts', {
          email: email,
          listIds: [BREVO_LIST_ID],
          updateEnabled: true
        }).then(function(contactResult) {
          console.log('Contact added:', email, contactResult);
        }).catch(function(err) {
          console.log('Contact error:', err);
        });

        // 2. Send guide email via template
        brevoRequest('/smtp/email', {
          templateId: BREVO_TEMPLATE_ID,
          to: [{ email: email }],
          params: { guide_link: guideLink || 'https://sofievp.com/guide-5-analizov.html' }
        }).then(function(emailResult) {
          console.log('Email sent to:', email, emailResult);
        }).catch(function(err) {
          console.log('Email error:', err);
        });

        sendJSON(res, 200, { success: true });

      } catch(e) {
        sendJSON(res, 400, { error: 'Invalid request body' });
      }
    });
    return;
  }

  sendJSON(res, 404, { error: 'Not found' });
});

server.listen(PORT, function() {
  console.log('Brevo API proxy running on port ' + PORT);
});
