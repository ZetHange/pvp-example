import { createSignal, type Component, Show } from "solid-js";
import Game from "./components/Game";

const App: Component = () => {
  const [isLoggedIn, setIsLoggedIn] = createSignal(false);
  const [login, setLogin] = createSignal("user1");
  const [password, setPassword] = createSignal("1234");

  const checkAuth = async () => {
    const res = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(login() + ":" + password()),
      },
    });

    if (res.status === 401) {
      alert("Неверный пароль");
    } else {
      setIsLoggedIn(true);
    }
  };
  const register = async () => {
    const res = await fetch("http://localhost:8080/login", {
      method: "POST",
      body: JSON.stringify({
        login,
        password,
      }),
    });
    if (res.status === 201) {
      alert("Вы зарегистрированны успешно");
      location.reload();
    }
  };

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
        <input
          placeholder="Пароль..."
          value={password()}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
        <button onClick={() => checkAuth()}>Авторизоваться</button>
        <button onClick={() => register()}>Зарегистрироваться</button>
      </Show>
      <Show when={isLoggedIn()}>
        <Game login={login()} password={password()} />
      </Show>
    </div>
  );
};

export default App;
