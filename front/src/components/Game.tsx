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
}

const Game: Component<Props> = ({ login }) => {
  const [map, setMap] = createSignal<IMap>({
    background: "",
    id: 0,
    positions: [],
    title: "",
  });
  const [pos, setPos] = createSignal<IPos[]>();
  const [myPos, setMyPos] = createSignal<any>();

  console.log(location.hostname);
  const ws = new WebSocket(`wss://${location.hostname}/map?id=0&auth=` + login);

  const handleKeyPress = (event: any) => {
    const stepCount = 3;
    switch (event.key) {
      case "w":
        var newPos = {
          ...myPos(),
          y: myPos().y + stepCount,
        };
        break;
      case "s":
        var newPos = {
          ...myPos(),
          y: myPos().y - stepCount,
        };
        break;
      case "a":
        var newPos = {
          ...myPos(),
          x: myPos().x - stepCount,
        };
        break;
      case "d":
        var newPos = {
          ...myPos(),
          x: myPos().x + stepCount,
        };
        break;
    }
    if (newPos) {
      setMyPos(newPos);
      ws.send(JSON.stringify(newPos));
    }
  };

  window.addEventListener("keydown", handleKeyPress);

  ws.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    const posCopy: IPos[] = JSON.parse(
      JSON.stringify(pos() || { x: 500, y: 500 })
    );

    switch (data.type) {
      case "map":
        console.log("Карта:", data);
        setMap(data);
        setMyPos(data.position);
        setPos(data.positions);
        return;
      case "close":
        console.log("Пользователь отключился:", data);
        const posId = posCopy?.indexOf(
          posCopy?.find((pos) => pos.login === data.login)!
        );
        posCopy.splice(posId, 1);
        setPos(posCopy);
        return;
      case "updatePosition":
        console.log("Обновление позиции:", data);
        const posIdUpdate = posCopy?.indexOf(
          posCopy?.find((pos) => pos.login === data.login)!
        );
        posCopy?.splice(posIdUpdate!, 1, data);
        setPos(posCopy);
        return;
      case "newUser":
        console.log("Новый пользователь:", data);
        posCopy.push(data);
        setPos(posCopy);
        return;
    }
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
