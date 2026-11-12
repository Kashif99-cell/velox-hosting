
document.getElementById("year").textContent = new Date().getFullYear();
document.querySelectorAll(".choose").forEach(button => {
  button.addEventListener("click", () => {
    document.getElementById("plan").value = button.dataset.plan;
  });
});
const form = document.getElementById("orderForm");
form.addEventListener("submit", async event => {
  event.preventDefault();
  const message = document.getElementById("formMessage");
  const data = Object.fromEntries(new FormData(form).entries());
  message.textContent = "Submitting...";
  try {
    const response = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not submit order.");
    message.textContent = result.message + " Order ID: " + result.orderId;
    form.reset();
  } catch (error) { message.textContent = error.message; }
});
