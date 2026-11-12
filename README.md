VELOX HOSTING
Minecraft hosting order website with an Express backend and Pterodactyl Application API integration.
Files
All files stay in the repository root: index.html, admin.html, style.css, app.js, admin.js, server.js, package.json, .env.example, README.md.
Important
GitHub Pages only serves static files. It cannot run this Node.js backend.
Deploy this whole repository to a Node.js hosting service that supports Node 18+.
Never upload .env, API keys, admin passwords, payment PINs, or customer secrets to GitHub.
This starter stores orders in orders.json; use a proper database and stronger authentication before public commercial use.
The server creation route is an admin tool. Review and verify payment before clicking it.
Configure the correct Pterodactyl Nest, Egg, Location and Allocation IDs for your panel. Egg environment variables may differ; adjust PTERO_ENVIRONMENT_JSON as required by your selected egg.
Pterodactyl API keys must be Application API keys with appropriate permissions. Keep them private.
Setup
Install Node.js 18 or newer on your backend host.
Upload the project files.
Copy .env.example to .env using the hosting provider's private environment-variable settings. Do not commit .env.
Fill in the panel URL, Application API key, customer details, Nest ID, Egg ID and Allocation ID.
Set a long unique ADMIN_PASSWORD.
Run npm install, then npm start.
Open / for the website and /admin for the admin dashboard.
Pterodactyl notes
The code creates/finds one panel user using the configured email, then creates a server for that user. This starter uses one configured customer account; a real hosting business should create/associate a separate panel user for each verified customer. Confirm the selected allocation is free and compatible with the node/location. Test on a non-production panel first.
Plans
Starter: 2 GB RAM, 5 GB disk, 100% CPU. Pro: 4 GB RAM, 10 GB disk, 200% CPU. Ultimate: 8 GB RAM, 20 GB disk, 300% CPU. Update plans in server.js and the plan cards in index.html together if you change limits.
Payment
The site does not collect or verify payments. Share verified JazzCash/EasyPaisa instructions with customers manually after reviewing each order. Do not ask customers for PINs or OTPs.
