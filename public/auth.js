// auth.js - Sistema de autenticación para Frenos Hugo

class AuthManager {
  constructor() {
    this.initializeAuth();
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    const loginTime = localStorage.getItem("loginTime");

    // Verificar si la sesión ha expirado (8 horas)
    if (isAuth && loginTime) {
      const currentTime = new Date().getTime();
      const sessionDuration = 8 * 60 * 60 * 1000; // 8 horas en milisegundos

      if (currentTime - parseInt(loginTime) > sessionDuration) {
        this.logout();
        return false;
      }
    }

    return isAuth;
  }

  // Obtener el nombre de usuario
  getUsername() {
    return localStorage.getItem("username") || "Usuario";
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("loginTime");
    window.location.href = "login.html";
  }

  // Proteger página (redirigir a login si no está autenticado)
  protectPage() {
    if (!this.isAuthenticated()) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  }

  // Inicializar autenticación en la página
  initializeAuth() {
    // Si estamos en login.html y ya estamos autenticados, redirigir
    if (
      window.location.pathname.includes("login.html") &&
      this.isAuthenticated()
    ) {
      window.location.href = "index.html";
      return;
    }

    // Si no estamos en login.html, proteger la página
    if (!window.location.pathname.includes("login.html")) {
      this.protectPage();
      this.addLogoutButton();
    }
  }

  // Agregar botón de cerrar sesión a las páginas
  addLogoutButton() {
    const header = document.querySelector("header");
    if (header && !document.getElementById("logoutBtn")) {
      const nav = header.querySelector("nav ul");
      if (nav) {
        const logoutLi = document.createElement("li");
        logoutLi.innerHTML = `
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="color: #fff; font-size: 14px;">
              👤 ${this.getUsername()}
            </span>
            <button 
              id="logoutBtn" 
              style="
                background: #dc3545; 
                color: white; 
                border: none; 
                padding: 8px 12px; 
                border-radius: 4px; 
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
              "
              onmouseover="this.style.background='#c82333'"
              onmouseout="this.style.background='#dc3545'"
            >
              Cerrar Sesión
            </button>
          </div>
        `;
        nav.appendChild(logoutLi);

        // Agregar evento de logout
        document.getElementById("logoutBtn").addEventListener("click", () => {
          if (confirm("¿Está seguro que desea cerrar sesión?")) {
            this.logout();
          }
        });
      }
    }
  }

  // Actualizar tiempo de actividad
  updateActivity() {
    if (this.isAuthenticated()) {
      localStorage.setItem("loginTime", new Date().getTime());
    }
  }
}

// Crear instancia global del manejador de autenticación
const authManager = new AuthManager();

// Actualizar actividad cada 5 minutos
setInterval(() => {
  authManager.updateActivity();
}, 5 * 60 * 1000);

// Actualizar actividad en interacciones del usuario
document.addEventListener("click", () => authManager.updateActivity());
document.addEventListener("keypress", () => authManager.updateActivity());

// Exportar para uso global
window.authManager = authManager;
