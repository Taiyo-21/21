import { API_URL } from "./config.js";

/**
 * Получает данные текущего пользователя
 * @returns {Promise<Object|null>} Объект пользователя или null
 */
export async function get_current_user() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return null;
  }

  // Попробуем взять данные из localStorage
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (err) {
      console.warn("Ошибка при парсинге сохранённого пользователя", err);
    }
  }

  // Если данных нет — запрашиваем с сервера
  try {
    const res = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Ошибка получения пользователя: ${res.status}`);
    }

    const user = await res.json();
    localStorage.setItem("user", JSON.stringify(user)); // Сохраняем для последующих вызовов
    return user;

  } catch (err) {
    console.error("Не удалось получить данные пользователя:", err);
    return null;
  }
}

/**
 * Проверяет роль пользователя и обновляет интерфейс
 */
export async function checkUserRole() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    updateUserInfo(); // Отображаем "Гость"
    hideAdminLinks();
    return null;
  }

  try {
    const user = await get_current_user();

    if (!user) {
      throw new Error("Пользователь не найден");
    }

    // Обновляем интерфейс
    updateUserInfo(user);

    // Показываем/скрываем админ-ссылки
    const adminLinks = document.querySelectorAll(".admin-only");

    if (user.role === "admin") {
      adminLinks.forEach((link) => {
        link.classList.remove("hidden");
        link.style.display = "";
      });
    } else {
      adminLinks.forEach((link) => {
        link.classList.add("hidden");
        link.style.display = "none";
      });
    }

    return user;

  } catch (err) {
    console.error("Ошибка при получении данных пользователя:", err);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    updateUserInfo(); // Отображаем "Гость"
    hideAdminLinks();
    return null;
  }
}

/**
 * Скрывает все элементы с классом .admin-only
 */
export function hideAdminLinks() {
  const adminLinks = document.querySelectorAll(".admin-only");
  adminLinks.forEach((link) => {
    link.classList.add("hidden");
    link.style.display = "none";
  });
}

/**
 * Выход из аккаунта
 */
export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  window.location.href = "/frontend/login.html";
}

/**
 * Обновляет имя пользователя на странице
 * @param {Object} [user] - объект пользователя или null
 */
function updateUserInfo(user = null) {
  const usernameSpan = document.getElementById("username");
  if (!usernameSpan) return;

  usernameSpan.textContent = user?.username || "Гость";
}

// Глобальная переменная для onclick="logout()"
window.logout = logout;

// При загрузке страницы проверяем пользователя
document.addEventListener("DOMContentLoaded", () => {
  checkUserRole();
});