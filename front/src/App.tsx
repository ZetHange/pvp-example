import { createSignal, type Component, Show } from "solid-js";
import Game from "./components/Game";

const App: Component = () => {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [login, setLogin] = createSignal("user");

  return (
    <div>
      <Show when={!isLoggedIn()}>
        <input
          placeholder="Логин..."
          value={login()}
          onChange={(e) => {
            setLogin(e.target.value);
          }}
        />
        <button onClick={() => setIsLoggedIn(true)}>Войти</button>
      </Show>
      <Show when={isLoggedIn()}>
        <Game login={login()} />
      </Show>
    </div>
  );
};

export default App;
