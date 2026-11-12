require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(__dirname, "orders.json");

app.use(express.json({ limit: "30kb" }));
app.use(express.static(__dirname));

function readOrders() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")); }
  catch { return []; }
}
function writeOrders(items) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2));
}
function adminOnly(req, res, next) {
  const supplied = req.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD || !supplied ||
      supplied !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Admin login required." });
  }
  next();
}
const plans = {
  starter: { name: "Starter", memory: 2048, disk: 5120, cpu: 100 },
  pro: { name: "Pro", memory: 4096, disk: 10240, cpu: 200 },
  ultimate: { name: "Ultimate", memory: 8192, disk: 20480, cpu: 300 }
};

app.get("/api/status", (_req, res) => res.json({
  site: process.env.SITE_NAME || "VELOX HOSTING",
  configured: Boolean(process.env.PTERO_URL && process.env.PTERO_API_KEY)
}));

app.post("/api/orders", (req, res) => {
  const { customer, email, serverName, plan, version, notes } = req.body || {};
  if (![customer, email, serverName, plan, version].every(v =>
      typeof v === "string" && v.trim().length > 0)) {
    return res.status(400).json({ error: "Please complete all required fields." });
  }
  if (!plans[plan]) return res.status(400).json({ error: "Invalid hosting plan." });
  if (customer.length > 80 || email.length > 120 || serverName.length > 32 ||
      notes?.length > 500) return res.status(400).json({ error: "Some fields are too long." });

  const orders = readOrders();
  const order = {
    id: "VX-" + Date.now().toString(36).toUpperCase(),
    customer: customer.trim(), email: email.trim(), serverName: serverName.trim(),
    plan, version: version.trim(), notes: String(notes || "").trim(),
    status: "Pending review", createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  writeOrders(orders);
  res.status(201).json({ message: "Order received. Admin will review it.", orderId: order.id });
});

app.get("/api/admin/orders", adminOnly, (_req, res) => res.json(readOrders()));

app.post("/api/admin/orders/:id/status", adminOnly, (req, res) => {
  const allowed = ["Pending review", "Approved", "Rejected", "Completed"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid status." });
  const orders = readOrders();
  const item = orders.find(o => o.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Order not found." });
  item.status = req.body.status;
  writeOrders(orders);
  res.json({ message: "Order status updated." });
});

app.post("/api/admin/orders/:id/create-server", adminOnly, async (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (!process.env.PTERO_URL || !process.env.PTERO_API_KEY) {
    return res.status(503).json({ error: "Pterodactyl settings are not configured." });
  }

  const plan = plans[order.plan];
  const required = ["PTERO_CLIENT_EMAIL", "PTERO_CLIENT_USERNAME", "PTERO_EGG_ID",
    "PTERO_ALLOCATION_ID", "PTERO_NEST_ID"];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) return res.status(503).json({ error: "Missing settings: " + missing.join(", ") });

  try {
    const base = process.env.PTERO_URL.replace(/\/+$/, "");
    const headers = {
      "Authorization": "Bearer " + process.env.PTERO_API_KEY,
      "Accept": "Application/vnd.pterodactyl.v1+json",
      "Content-Type": "application/json"
    };
    const userResponse = await fetch(base + "/api/application/users", {
      method: "POST", headers,
      body: JSON.stringify({
        email: process.env.PTERO_CLIENT_EMAIL,
        username: process.env.PTERO_CLIENT_USERNAME,
        first_name: process.env.PTERO_CLIENT_FIRST_NAME || "Velox",
        last_name: process.env.PTERO_CLIENT_LAST_NAME || "Customer",
        password: "Vx-" + require("crypto").randomBytes(18).toString("hex") + "aA1!"
      })
    });
    const userData = await userResponse.json();
    let userId;
    if (userResponse.ok) userId = userData.attributes.id;
    else if (userResponse.status === 422) {
      const lookup = await fetch(base + "/api/application/users?per_page=100", { headers });
      const lookupData = await lookup.json();
      const found = (lookupData.data || []).find(u =>
        u.attributes.email === process.env.PTERO_CLIENT_EMAIL);
      if (found) userId = found.attributes.id;
    }
    if (!userId) throw new Error("Could not create/find panel user. Check panel settings and permissions.");

    const env = {
      SERVER_JARFILE: process.env.PTERO_SERVER_JARFILE || "server.jar",
      SERVER_MEMORY: String(plan.memory),
      SERVER_IP: "0.0.0.0",
      SERVER_PORT: "25565",
      ...JSON.parse(process.env.PTERO_ENVIRONMENT_JSON || "{}")
    };
    const createResponse = await fetch(base + "/api/application/servers", {
      method: "POST", headers,
      body: JSON.stringify({
        name: order.serverName,
        user: userId,
        egg: Number(process.env.PTERO_EGG_ID),
        docker_image: process.env.PTERO_DOCKER_IMAGE || "ghcr.io/pterodactyl/yolks:java_21",
        startup: process.env.PTERO_STARTUP || "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}",
        environment: env,
        limits: { memory: plan.memory, swap: 0, disk: plan.disk, io: 500, cpu: plan.cpu },
        feature_limits: { databases: 1, backups: 1, allocations: 1 },
        allocation: { default: Number(process.env.PTERO_ALLOCATION_ID) },
        deploy: { locations: [Number(process.env.PTERO_LOCATION_ID || 1)],
          dedicated_ip: false, port_range: [] }
      })
    });
    const result = await createResponse.json();
    if (!createResponse.ok) {
      const msg = result.errors?.[0]?.detail || "Pterodactyl rejected server creation.";
      return res.status(502).json({ error: msg });
    }
    order.status = "Completed";
    order.pterodactylServerId = result.attributes.id;
    writeOrders(orders);
    res.json({ message: "Server created.", serverId: result.attributes.id });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server creation failed." });
  }
});

app.get("/admin", (_req, res) => res.sendFile(path.join(__dirname, "admin.html")));
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

app.listen(PORT, () => console.log(`VELOX HOSTING running on port ${PORT}`));
      
