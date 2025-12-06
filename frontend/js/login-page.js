document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const statusEl = document.getElementById("status");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
      statusEl.textContent = "Введите имя и пароль";
      return;
    }

    try {
      const res = await fetch("http://localhost:5500/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        throw new Error("Сервер вернул некорректный JSON");
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        window.location.href = "orders.html"; // Перенаправление
      } else {
        statusEl.textContent = "Неверные имя или пароль";
      }
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Ошибка подключения к серверу";
    }
  });

  // Проверяем роль пользователя при загрузке страницы
  window.onload = () => {
    checkUserRole();
  };
});