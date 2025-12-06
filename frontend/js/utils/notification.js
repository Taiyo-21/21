/**
 * Показывает уведомление на экране
 * @param {string} message - Текст уведомления
 * @param {boolean} isSuccess - true = успех, false = ошибка
 */
export function showNotification(message, isSuccess = true) {
  const notificationContainer = document.getElementById("notification-container");
  if (!notificationContainer) {
    console.warn("Элемент #notification-container не найден");
    return;
  }

  // Создаём элемент уведомления
  const notification = document.createElement("div");
  notification.className = `notification ${isSuccess ? "success" : "error"} hidden`;
  notification.innerHTML = `
    <span class="message">${message}</span>
    <button class="close-btn">&times;</button>
  `;

  notificationContainer.appendChild(notification);

  // Анимация появления
  setTimeout(() => {
    notification.classList.remove("hidden");
  }, 10); // Небольшая задержка для корректной анимации

  // Автоматическое исчезновение через 3 секунды
  setTimeout(() => {
    notification.classList.add("hidden");
    setTimeout(() => notification.remove(), 300);
  }, 3000);

  // Обработчик закрытия кнопкой ×
  notification.querySelector(".close-btn").addEventListener("click", () => {
    notification.classList.add("hidden");
    setTimeout(() => notification.remove(), 300);
  });
}