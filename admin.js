const login = document.getElementById("login");
const list = document.getElementById("orders");
const msg = document.getElementById("msg");
let secret = "";
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", "x-admin-password": secret, ...(options.headers || {}) }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}
login.addEventListener("submit", async e => {
  e.preventDefault();
  secret = document.getElementById("password").value;
  msg.textContent = "Loading...";
  try { await loadOrders(); msg.textContent = "Orders loaded."; }
  catch (err) { msg.textContent = err.message; list.innerHTML = ""; }
});
async function loadOrders() {
  const orders = await api("/api/admin/orders");
  list.innerHTML = "";
  if (!orders.length) { list.textContent = "No orders yet."; return; }
  orders.forEach(order => {
    const card = document.createElement("article");
    const title = document.createElement("h3"); title.textContent = order.serverName + " — " + order.id;
    const info = document.createElement("p");
    info.textContent = `${order.customer} | ${order.email} | ${order.plan} | MC ${order.version} | ${order.status}`;
    const status = document.createElement("select");
    ["Pending review","Approved","Rejected","Completed"].forEach(s => {
      const option = document.createElement("option"); option.value = s; option.textContent = s;
      if (s === order.status) option.selected = true; status.appendChild(option);
    });
    const update = document.createElement("button"); update.className = "btn"; update.textContent = "Update status";
    update.onclick = async () => { try { await api(`/api/admin/orders/${order.id}/status`, {method:"POST",body:JSON.stringify({status:status.value})}); await loadOrders(); } catch(e) { alert(e.message); } };
    const create = document.createElement("button"); create.className = "btn"; create.style.marginLeft = "8px"; create.textContent = "Create Pterodactyl server";
    create.onclick = async () => { if (!confirm("Create a server for this order? Check panel settings and payment first.")) return; try { const r = await api(`/api/admin/orders/${order.id}/create-server`, {method:"POST",body:"{}"}); alert(r.message + " Server ID: " + r.serverId); await loadOrders(); } catch(e) { alert(e.message); } };
    card.append(title, info, status, document.createTextNode(" "), update, create);
    list.appendChild(card);
  });
}
