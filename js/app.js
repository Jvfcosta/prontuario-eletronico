// Módulo principal da aplicação
const App = {
    // Estado da aplicação
    state: {
        initialized: false,
        currentView: 'dashboard'
    },

    // Inicializar aplicação
    async init() {
        try {
            console.log('Inicializando aplicação...');

            // Inicializar banco de dados
            if (!Database.init()) {
                throw new Error('Falha ao inicializar banco de dados');
            }

            // Inicializar módulos
            UI.init();
            Patients.init();
            MedicalRecords.init();

            // Verificar autenticação
            await this.checkAuthentication();

            // Configurar data inicial do atendimento
            this.initializeDateFields();

            // Atualizar estatísticas
            await this.updateStats();

            this.state.initialized = true;
            console.log('Aplicação inicializada com sucesso');

        } catch (error) {
            console.error('Erro na inicialização da aplicação:', error);
            UI.showError('dashboard', 'Erro ao inicializar o sistema. Por favor, recarregue a página.');
        }
    },

    // Verificar autenticação
    async checkAuthentication() {
        if (Auth.isLoggedIn()) {
            const currentUser = Auth.getCurrentUser();
            UI.updateUserInfo(currentUser.username);
            UI.showMainPage();
        } else {
            UI.showLoginPage();
            this.setupLoginHandler();
        }
    },

    // Configurar handler de login
    setupLoginHandler() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    },

    // Manipular login
    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('usuario').value;
        const password = document.getElementById('senha').value;

        if (!username || !password) {
            Utils.showAlert('login-alert', 'Por favor, preencha todos os campos', 'error');
            return;
        }

        try {
            if (Auth.authenticate(username, password)) {
                const userSession = Auth.login(username);
                
                if (userSession) {
                    UI.updateUserInfo(username);
                    UI.showMainPage();
                    Utils.showAlert('login-alert', 'Login realizado com sucesso!', 'success');
                    
                    // Atualizar estatísticas após login
                    await this.updateStats();
                } else {
                    throw new Error('Falha ao criar sessão');
                }
            } else {
                Utils.showAlert('login-alert', 'Usuário ou senha incorretos', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            Utils.showAlert('login-alert', 'Erro ao fazer login', 'error');
        }
    },

    // Inicializar campos de data
    initializeDateFields() {
        const today = new Date().toISOString().split('T')[0];
        const dataAtendimento = document.getElementById('data-atendimento');
        
        if (dataAtendimento) {
            dataAtendimento.value = today;
            dataAtendimento.max = today;
        }
    },

    // Atualizar estatísticas
    async updateStats() {
        try {
            const stats = Database.getStatistics();
            UI.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Erro ao atualizar estatísticas:', error);
        }
    },

    // Exportar dados
    async exportData() {
        try {
            Database.backup();
            Utils.showAlert('patient-alert', 'Backup realizado com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            Utils.showAlert('patient-alert', 'Erro ao fazer backup', 'error');
        }
    },

    // Importar dados
    async importData(file) {
        try {
            await Database.restore(file);
            Utils.showAlert('patient-alert', 'Dados restaurados com sucesso!', 'success');
            
            // Recarregar dados
            await Patients.loadPatients();
            await this.updateStats();
            
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            Utils.showAlert('patient-alert', 'Erro ao restaurar dados: ' + error.message, 'error');
        }
    },

    // Manipular importação de arquivo
    setupFileImport() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importData(file);
            }
        });
        
        document.body.appendChild(fileInput);
        return fileInput;
    }
};

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    App.init();
});

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}