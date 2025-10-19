// Módulo de autenticação
const Auth = {
    // Configuração de autenticação
    CONFIG: {
        username: 'admin',
        password: '1234',
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 horas
    },

    // Verificar credenciais
    authenticate(username, password) {
        return username === this.CONFIG.username && password === this.CONFIG.password;
    },

    // Fazer login
    login(username) {
        const userSession = { 
            username, 
            loginTime: new Date().toISOString(),
            token: this.generateToken()
        };
        
        if (Database.saveUserSession(userSession)) {
            return userSession;
        }
        return null;
    },

    // Fazer logout
    logout() {
        return Database.clearUserSession();
    },

    // Verificar se usuário está logado
    isLoggedIn() {
        const session = Database.getUserSession();
        if (!session) return false;
        
        // Verificar se a sessão expirou
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const sessionAge = now - loginTime;
        
        return sessionAge < this.CONFIG.sessionTimeout;
    },

    // Obter usuário atual
    getCurrentUser() {
        return Database.getUserSession();
    },

    // Gerar token simples
    generateToken() {
        return Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
    },

    // Validar sessão
    validateSession() {
        if (!this.isLoggedIn()) {
            this.logout();
            return false;
        }
        return true;
    },

    // Atualizar sessão
    refreshSession() {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            currentUser.loginTime = new Date().toISOString();
            Database.saveUserSession(currentUser);
        }
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}