const API_URL = "http://localhost:5500";

// Проверка роли пользователя
async function checkUserRole() {
  const token = localStorage.getItem("access_token");
  if (!token) return;

  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      localStorage.removeItem("access_token");
      document.getElementById("login-status").textContent = "";
      return;
    }

    const user = await res.json();
    document.getElementById("login-status").textContent = `Вы вошли как ${user.name}`;

    // Показываем/скрываем элементы для админа
    const adminLinks = document.querySelectorAll(".admin-only");
    if (user.role === "admin") {
      adminLinks.forEach(link => link.style.display = "block");
    } else {
      adminLinks.forEach(link => link.style.display = "none");
    }
  } catch (err) {
    console.error("Ошибка получения данных пользователя:", err);
  }
}

// Функция выхода
function logout() {
  localStorage.removeItem("access_token");
  window.location.href = "login.html";
}

// Запуск проверки при загрузке страницы
window.onload = () => {
  checkUserRole();
};