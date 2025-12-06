import { API_URL } from "/frontend/js/config.js";
import { showNotification } from "/frontend/js/utils/notification.js";

// Загрузка списка товаров
async function loadProducts(containerId = "products-container") {
  const token = localStorage.getItem("access_token");

  if (!token) {
    console.warn("Токен отсутствует");
    document.getElementById(containerId).textContent = "Вы не авторизованы.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Ошибка загрузки: ${res.status}`);
    }

    const products = await res.json();
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!Array.isArray(products) || products.length === 0) {
      container.textContent = "Нет доступных товаров";
      return;
    }

    products.forEach(product => {
      const productDiv = document.createElement("div");
      productDiv.className = "product-card";
      productDiv.innerHTML = `
        <p><strong>ID:</strong> ${product.id}</p>
        <p><strong>Название:</strong> ${product.name}</p>
        <p><strong>Описание:</strong> ${product.description}</p>
        <p><strong>Цена:</strong> ${product.price} ₽</p>
        <p><strong>Дата:</strong> ${product.date || "Не указана"}</p>
        <hr>
      `;
      container.appendChild(productDiv);
    });

    console.log("Товары успешно загружены");

  } catch (err) {
    console.error("Ошибка при загрузке товаров:", err);
    const container = document.getElementById(containerId);
    if (container) {
      container.textContent = "Не удалось загрузить товары";
    }
  }
}

// Обработчик формы добавления товаров
async function handleAddProduct(e) {
  e.preventDefault();

  const name = document.getElementById("product-name").value.trim();
  const description = document.getElementById("product-description").value.trim();
  const price = parseFloat(document.getElementById("product-price").value);
  const date = document.getElementById("product-date").value;

  if (!name || !description || isNaN(price) || !date) {
    showNotification("Пожалуйста, заполните все поля корректно.", false);
    return;
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    showNotification("Вы не авторизованы", false);
    window.location.href = "/frontend/login.html";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/products/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, description, price, date })
    });

    if (!res.ok) {
      const errorText = await res.text();
      showNotification("Ошибка при добавлении товара", false);
      throw new Error(errorText);
    }

    showNotification("Товар успешно добавлен", true);

    document.getElementById("add-product-form").reset();
    loadProducts("products-container");

  } catch (err) {
    console.error("Ошибка при добавлении товара:", err);
    showNotification("Не удалось добавить товар", false);
  }
}

// Функция добавления товара в заказ (заглушка)
function addToOrder(product_id, quantity) {
  console.log(`Добавляем в заказ: Товар ID=${product_id}, кол-во=${quantity}`);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof checkUserRole === "function") {
    await checkUserRole(); // проверяем роль пользователя
  }

  loadProducts("products-container"); // загружаем список товаров

  // Обработчик формы создания товара
  const form = document.getElementById("add-product-form");
  if (form) {
    form.addEventListener("submit", handleAddProduct);
  }
});