import { API_URL } from "/frontend/js/config.js";
import { showNotification } from "/frontend/js/utils/notification.js";

document.addEventListener("DOMContentLoaded", () => {
  // Тестовое уведомление при загрузке страницы
  showNotification("Добро пожаловать!", true);

  const form = document.getElementById("date-form");
  const container = document.getElementById("collection-container");

  if (!form || !container) return;

  // Обработчик формы выбора даты
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dateInput = document.getElementById("filter-date");
    const date = dateInput.value;

    if (!date) {
      container.innerHTML = "<p>Выберите дату</p>";
      showNotification("Пожалуйста, выберите дату", false);
      return;
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];
    await loadCollection(formattedDate, container);
  });
  // Автоматически загружаем коллекцию на сегодня при открытии страницы
  const today = new Date().toISOString().split("T")[0];
  loadCollection(today, container);
});

// Загрузка коллекции по дате
async function loadCollection(date, container) {
  try {
    console.log("Отправляю запрос к серверу:", `${API_URL}/collection/?date=${date}`);

    const token = localStorage.getItem("access_token");

    const res = await fetch(`${API_URL}/collection/?date=${date}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Статус ответа:", res.status);

    if (!res.ok) {
      throw new Error(`Ошибка загрузки: ${res.status}`);
    }

    const collectionItems = await res.json();
    console.log("Полученные записи коллекции:", collectionItems);
    console.log("Ответ от сервера:", collectionItems);

    container.innerHTML = "";

    if (!Array.isArray(collectionItems) || collectionItems.length === 0) {
      container.innerHTML = "<p>На эту дату нет товаров в коллекции</p>";
      showNotification("На эту дату нет товаров", false);
      return;
    }

    // Отрисовываем каждый товар
    productItems.forEach((item) => {
      const product = {
        name: item.name || "Не указано",
        description: item.description || "Нет описания",
        product_id: item.product_id || "—",
        price: item.price !== undefined ? `${item.price} ₽` : "Не указана",
      };

      const productDiv = document.createElement("div");
      productDiv.className = "product-card";

      // Создаём элементы карточки
      productDiv.innerHTML = `
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p><strong>ID:</strong> ${product.product_id}</p>
        <p><strong>Цена:</strong> ${product.price}</p>

        <!-- Блок управления количеством -->
        <div class="quantity-control">
          <button class="qty-btn minus">-</button>
          <input type="number" class="quantity-input" value="1" min="1" />
          <button class="qty-btn plus">+</button>
        </div>

        <button class="order-btn">Заказать</button>
        <hr>
      `;

      // Находим элементы внутри карточки
      const qtyInput = productDiv.querySelector(".quantity-input");
      const btnMinus = productDiv.querySelector(".qty-btn.minus");
      const btnPlus = productDiv.querySelector(".qty-btn.plus");
      const orderBtn = productDiv.querySelector(".order-btn");

      // Логика кнопок + / -
      btnMinus.addEventListener("click", () => {
        let current = parseInt(qtyInput.value);
        if (current > 1) qtyInput.value = current - 1;
      });

      btnPlus.addEventListener("click", () => {
        let current = parseInt(qtyInput.value);
        qtyInput.value = current + 1;
      });

      // Логика кнопки "Заказать"
      orderBtn.addEventListener("click", () => {
        const quantity = parseInt(qtyInput.value);
        if (quantity < 1) {
          showNotification("Количество должно быть не меньше 1", false);
          return;
        }
        addToOrder(item.product_id, quantity);
      });

      // Добавляем карточку в контейнер
      container.appendChild(productDiv);
    });

    console.log("Коллекция успешно загружена");

  } catch (err) {
    console.error("Ошибка при загрузке коллеккции:", err);
    container.innerHTML = "<p>Не удалось загрузить коллекции</p>";
    showNotification("Не удалось загрузить коллекции", false);
  }
}

// Функция добавления товара в заказ
async function addToOrder(product_id, quantity) {
  const token = localStorage.getItem("access_token");
  if (!token) {
    showNotification("Вы не авторизованы", false);
    window.location.href = "/frontend/login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items: [{ product_id, quantity }] }),
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    showNotification("Товар добавлен в заказ", true);

  } catch (err) {
    console.error("Ошибка при оформлении заказа:", err);
    showNotification("Не удалось оформить заказ", false);
  }
}