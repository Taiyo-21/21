import { API_URL } from "./config.js";
import { showNotification } from "./utils/notification.js";
import { get_current_user } from "./auth.js";

document.addEventListener("DOMContentLoaded", async () => {
  const ordersContainer = document.getElementById("orders-list");
  const filterSelect = document.getElementById("order-filter");

  if (!ordersContainer) {
    console.warn("⚠️ Контейнер для заказов не найден");
    return;
  }

  try {
    const user = await get_current_user();
    const token = localStorage.getItem("access_token");

    if (!token) {
      showNotification("Вы не авторизованы", false);
      window.location.href = "/frontend/login.html";
      return;
    }

    // --- Функция загрузки заказов ---
    const loadOrders = async (statusFilter = "all") => {
      let url = `${API_URL}/orders/`;

      if (statusFilter && typeof statusFilter === "string" && statusFilter.trim().toLowerCase() !== "all") {
        const encodedStatus = encodeURIComponent(statusFilter.trim().toLowerCase());
        url += `?status=${encodedStatus}`;
      }

      console.log("🌐 Отправляем запрос:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(`Ошибка загрузки: ${res.status}`);
      }

      const orders = await res.json();
      console.log("📊 Полученные заказы:", orders);

      if (!Array.isArray(orders)) {
        console.error("❌ Сервер вернул неверный формат данных:", orders);
        ordersContainer.innerHTML = "<p>Ошибка получения данных</p>";
        return;
      }

      if (user.role === "admin") {
        displayAllOrders(ordersContainer, orders);
      } else {
        displayUserOrders(ordersContainer, orders);
      }
    };

    // --- Проверяем фильтр ---
    if (filterSelect) {
      console.log("✅ #order-filter найден");
      console.log("📋 Значение фильтра по умолчанию:", filterSelect.value);

      // Загрузка по умолчанию
      await loadOrders(filterSelect.value || "all");

      // Обработчик изменения фильтра
      filterSelect.addEventListener("change", async () => {
        const selectedStatus = filterSelect.value || "all";
        console.log("🔄 Выбран статус:", selectedStatus);
        await loadOrders(selectedStatus);
      });
    } else {
      console.error("❌ #order-filter НЕ НАЙДЕН");
      await loadOrders("all"); // Без фильтра
    }

  } catch (err) {
    console.error("❌ Ошибка при загрузке заказов:", err);
    ordersContainer.innerHTML = "<p>Не удалось загрузить заказы</p>";
    showNotification("Не удалось загрузить заказы", false);
  }
});

// --- Отображение заказов (для пользователя) ---
function displayUserOrders(container, orders) {
  container.innerHTML = "";

  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = "<p>Нет заказов по выбранному фильтру</p>";
    return;
  }

  orders.forEach((order) => {
    const orderDiv = document.createElement("div");
    orderDiv.className = "order-card";

    orderDiv.innerHTML = `
      <p><strong>ID:</strong> ${order.id}</p>
      <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Статус:</strong> ${order.status}</p>
      <p><strong>Товары:</strong></p>
      <ul>
        ${(Array.isArray(order.items)
          ? order.items.map(item => `<li>Товар ID: ${item.dish_id}, Кол-во: ${item.quantity}</li>`).join("")
          : "Нет товаров"
        )}
      </ul>
      <hr>
    `;

    container.appendChild(orderDiv);
  });
}

// --- Отображение всех заказов (для админа) ---
function displayAllOrders(container, orders) {
  container.innerHTML = "";

  if (!Array.isArray(orders) || orders.length === 0) {
    container.innerHTML = "<p>Нет заказов</p>";
    return;
  }

  console.log("Все заказы (админ):", orders);

  orders.forEach((order) => {
    const orderDiv = document.createElement("div");
    orderDiv.className = "order-card";

    orderDiv.innerHTML = `
      <p><strong>ID заказа:</strong> ${order.id}</p>
      <p><strong>Пользователь:</strong> ${order.user?.username || "—"} (${order.user_id})</p>
      <p><strong>Дата:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Статус:</strong> ${order.status}</p>
      <p><strong>Товар:</strong></p>
      <ul>
        ${(Array.isArray(order.items)
          ? order.items.map(item => `<li>Товар ID: ${item.product_id}, Количество: ${item.quantity}</li>`).join("")
          : "Нет товаров"
        )}
      </ul>
      <div class="order-actions">
        <button class="status-btn" data-id="${order.id}" data-status="in_process">В процессе</button>
        <button class="status-btn" data-id="${order.id}" data-status="completed">Выполнен</button>
      </div>
      <hr>
    `;

    container.appendChild(orderDiv);
  });

  // Добавляем обработчики для кнопок изменения статуса
  document.querySelectorAll(".status-btn").forEach(button => {
    button.addEventListener("click", async () => {
      const orderId = parseInt(button.dataset.id);
      const newStatus = button.dataset.status;

      await updateOrderStatus(orderId, newStatus);

      // Перезагружаем список после изменения статуса
      const filterSelect = document.getElementById("order-filter");
      const selectedStatus = filterSelect?.value || "all";
      await loadOrders(selectedStatus);
    });
  });
}

// --- Обновление статуса заказа ---
async function updateOrderStatus(orderId, newStatus) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    showNotification("Вы не авторизованы", false);
    window.location.href = "/frontend/login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ new_status: newStatus }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Ошибка обновления статуса:", errText);
      showNotification("Не удалось обновить статус", false);
      return;
    }

    showNotification("Статус заказа изменён", true);
  } catch (err) {
    console.error("Ошибка при обновлении статуса:", err);
    showNotification("Не удалось обновить статус", false);
  }
}