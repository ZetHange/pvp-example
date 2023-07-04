import { createSignal, type Component, For } from "solid-js";

interface IPos {
  login: string;
  pos: {
    x: number;
    y: number;
  };
}

interface IMap {
  id: number;
  title: string;
  background: string;
  positions: IPos[];
}

interface Props {
  login: string;
  password: string;
}

const Game: Component<Props> = ({ login, password }) => {
  const [map, setMap] = createSignal<IMap>({
    background: "",
    id: 0,
    positions: [],
    title: "",
  });
  const [pos, setPos] = createSignal<IPos[]>();
  const [myPos, setMyPos] = createSignal<any>();

  const ws = new WebSocket(
    `ws://localhost:8080/map?id=0&auth=${login}:${password}`
  );

  const handleKeyPress = (event: any) => {
    const stepCount = 3;
    if (event.key === "w") {
      const newPos = {
        ...myPos(),
        y: myPos().y + stepCount,
      };
      setMyPos(newPos);
      ws.send(JSON.stringify(newPos));
    } else if (event.key === "s") {
      const newPos = {
        ...myPos(),
        y: myPos().y - stepCount,
      };
      setMyPos(newPos);
      ws.send(JSON.stringify(newPos));
    } else if (event.key === "a") {
      const newPos = {
        ...myPos(),
        x: myPos().x - stepCount,
      };
      setMyPos(newPos);
      ws.send(JSON.stringify(newPos));
    } else if (event.key === "d") {
      const newPos = {
        ...myPos(),
        x: myPos().x + stepCount,
      };
      setMyPos(newPos);
      ws.send(JSON.stringify(newPos));
    }
  };

  window.addEventListener("keydown", handleKeyPress);

  ws.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);

    if (data.title === "Кордон") {
      console.log(data);
      setMap(data);
      setMyPos(data.position);
      setPos(data.positions);
      return;
    }
    const posCopy: IPos[] = JSON.parse(JSON.stringify(pos()));

    if (data.type === "close") {
      const posId = posCopy?.indexOf(
        posCopy?.find((pos) => pos.login === data.login)!
      );
      posCopy.splice(posId, 1);
      setPos(posCopy);
      return;
    }
    const posId = posCopy?.indexOf(
      posCopy?.find((pos) => pos.login === data.login)!
    );
    if (posId === -1) {
      posCopy.push(data);
    } else {
      posCopy?.splice(posId!, 1, data);
    }
    console.log(posCopy);

    setPos(posCopy);
  };

  return (
    <div>
      <div>{map().title}: Пользователи</div>
      <div>
        <For each={map().positions}>{(pos) => <div>{pos.login}</div>}</For>
      </div>
      <div style={{ position: "relative" }}>
        <img src={map().background} />
        <For each={pos()}>
          {(pos) => {
            console.log(pos);
            return (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: pos.pos.x + "px",
                    bottom: pos.pos.y + 20 + "px",
                    color: "white",
                    "mix-blend-mode": "difference",
                  }}
                >
                  {pos.login}
                </div>
                <img
                  style={{
                    position: "absolute",
                    left: pos.pos.x + "px",
                    bottom: pos.pos.y + "px",
                    width: "10px",
                  }}
                  src="https://story.artux.net/static/tags/yellow.png"
                />
              </>
            );
          }}
        </For>
      </div>
    </div>
  );
};

export default Game;
