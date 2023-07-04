import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';
import cors from 'cors'

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ path: '/map', server });
app.use(cors())

wss.setMaxListeners(1000);

const users = [
  { login: 'user1', password: '1234' },
  { login: 'user2', password: '1234' },
  { login: 'user3', password: '1234' },
  { login: 'user4', password: '1234' },
  { login: 'user5', password: '1234' },
]
const maps = [
  {
    id: 0,
    title: "Кордон",
    background: "https://story.artux.net/static/maps/map_escape.png"
  }
]
const positions = []
const connectedUsers = new Set();

app.get('/getUsers', (req, res) => {
  res.status(200).send(users);
})
app.post('/login', (req, res) => {
  const authHeader = req.headers.authorization.split(' ')[1];
  const [login, password] = atob(authHeader).split(":");
  const candidateUser = users.find(user => user.login === login);
  if (!candidateUser || candidateUser.password !== password) {
    res.status(401).send({
      statusCode: 401,
      message: "Логин или пароль неверный"
    });
  };
  res.status(200).send("OK");
})
app.get('/getPositions', (req, res) => {
  res.status(200).send(positions);
})
app.get('/getConnectedUsers', (req, res) => {
  res.status(200).send(Array.from(connectedUsers));
})
app.post('/register', (req, res) => {
  users.push(req.body);
  res.status(201).send(req.body)
})

wss.on('connection', async (ws, req) => {
  const auth = req.url.split('auth=')[1]
  if (!auth) {
    ws.send("Нет хедера авторизации");
    ws.close();
    return;
  };
  const [login, password] = (auth).split(':');
  const user = users.find(user => user.login === login);
  if (!user || user.password !== password) {
    ws.send("Логин или пароль неверный");
    ws.close();
    return;
  }

  if (connectedUsers.has(login)) {
    ws.send("User already connected");
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
  broadcast(JSON.stringify({ login, pos: { x: 500, y: 500 } }))
  ws.on('error', console.error);

  ws.on('message', async (data) => {
    const pos = JSON.parse(data.toString())

    const index = positions.indexOf(positions.find(position => position.login === login));
    positions.splice(index, 1, { login, pos })

    const message = { login, pos, timestamp: new Date().toISOString() }
    broadcast(JSON.stringify(message))
  });

  ws.send(JSON.stringify({
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