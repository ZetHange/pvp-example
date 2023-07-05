import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';
import cors from 'cors'
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ path: '/map', server });
app.use(cors())

wss.setMaxListeners(1000);

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const maps = [
  {
    id: 0,
    title: "Кордон",
    background: "https://story.artux.net/static/maps/map_escape.png"
  }
]
const positions = []
const connectedUsers = new Set();

app.get('/getPositions', (req, res) => {
  res.status(200).send(positions);
})
app.get('/getConnectedUsers', (req, res) => {
  res.status(200).send(Array.from(connectedUsers));
})
app.use('/', express.static(__dirname + '/static'));


wss.on('connection', async (ws, req) => {
  const login = req.url.split('auth=')[1]

  if (connectedUsers.has(login)) {
    ws.send("Пользователь уже присоединился");
    ws.close();
    return;
  }

  connectedUsers.add(login);
  positions.push({ login, pos: { x: 500, y: 500 } })

  const mapId = +req.url.split("id=")[1].split("&")[0];
  if (isNaN(mapId) || !maps.find(map => map.id === mapId)) {
    ws.send("Map not found");
    ws.close();
    return;
  }
  const map = maps.find(map => map.id === mapId)

  const broadcast = (msg) => {
    for (const client of wss.clients) {
      if (client.readyState === ws.OPEN) {
        client.send(msg)
      }
    }
  }
  ws.on('error', console.error);

  ws.on('message', async (data) => {
    if (data.toString() === "undefined" || data === undefined) {
      return;
    }
    const pos = JSON.parse(data.toString())

    const index = positions.indexOf(positions.find(position => position.login === login));
    positions.splice(index, 1, { login, pos })

    const message = { type: "updatePosition", login, pos, timestamp: new Date().toISOString() }
    broadcast(JSON.stringify(message))
  });

  broadcast(JSON.stringify({ type: "newUser", login, pos: { x: 500, y: 500 } }))
  ws.send(JSON.stringify({
    type: "map",
    ...map, position: {
      x: 500, y: 500
    },
    positions,
  }))


  ws.on('close', () => {
    connectedUsers.delete(login);
    const index = positions.indexOf(positions.find(position => position.login === login));
    positions.splice(index, 1);
    broadcast(JSON.stringify({
      type: 'close',
      login,
    }))
  });
});

server.listen(8080, () => {
  console.log('Server started on port 8080');
});