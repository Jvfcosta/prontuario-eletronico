// Módulo de interface do usuário
const UI = {
    // Inicializar módulo
    init() {
        this.bindEvents();
        this.initializeDateFields();
    },

    // Vincular eventos globais
    bindEvents() {
        // Navegação
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const sectionId = e.target.getAttribute('data-section');
                this.handleNavigation(sectionId);
            }
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Fechar modal
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideModal('patient-select-modal'));
        }

        // Fechar modal ao clicar fora
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal')) {
                this.hideModal('patient-select-modal');
            }
        });
    },

    // Inicializar campos de data CORRIGIDO
    initializeDateFields() {
        const today = Utils.getCurrentDate(); // Usar função corrigida
        const dataAtendimento = document.getElementById('data-atendimento');
        
        if (dataAtendimento) {
            dataAtendimento.value = today;
            dataAtendimento.max = today; // Não permitir datas futuras
        }
    },

    // Manipular navegação
    handleNavigation(sectionId) {
        this.showSection(sectionId);
        this.updateNavigation(sectionId);

        // Ações específicas por seção
        switch (sectionId) {
            case 'prontuario':
                MedicalRecords.showPatientSelectModal();
                break;
            case 'lista-pacientes':
                Patients.loadPatients();
                break;
            case 'dashboard':
                App.updateStats();
                break;
        }
    },

    // Mostrar seção
    showSection(sectionId) {
        // Esconder todas as seções
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar seção específica
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    },

    // Atualizar navegação
    updateNavigation(activeSection) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[data-section="${activeSection}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    },

    // Mostrar modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Esconder modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Mostrar página de login
    showLoginPage() {
        document.getElementById('login-page').style.display = 'flex';
        document.getElementById('main-page').style.display = 'none';
    },

    // Mostrar página principal
    showMainPage() {
        document.getElementById('login-page').style.display = 'none';
        document.getElementById('main-page').style.display = 'block';
    },

    // Atualizar informações do usuário
    updateUserInfo(username) {
        const userElement = document.getElementById('user-name');
        if (userElement) {
            userElement.textContent = `Dr. ${username}`;
        }
    },

    // Manipular logout
    handleLogout() {
        Auth.logout();
        this.showLoginPage();
        this.resetForms();
    },

    // Resetar formulários
    resetForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
        
        // Resetar estado dos módulos
        Patients.currentState.editingPatientId = null;
        MedicalRecords.currentState.selectedPatientId = null;
        MedicalRecords.currentState.currentPatient = null;
        
        // Resetar interface do prontuário
        const patientName = document.getElementById('patient-name');
        const patientInfo = document.getElementById('patient-info');
        
        if (patientName) patientName.textContent = 'Nome do Paciente';
        if (patientInfo) patientInfo.textContent = 'Idade: -- | CPF: --';
    },

    // Mostrar carregamento
    showLoading(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto 20px;"></div>
                    <p>Carregando...</p>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
        }
    },

    // Mostrar erro
    showError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h3>Erro</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn" style="margin-top: 20px;">
                        Recarregar Página
                    </button>
                </div>
            `;
        }
    },

    // Atualizar estatísticas na UI
    updateStatsDisplay(stats) {
        const totalPatients = document.getElementById('total-patients');
        const todayAppointments = document.getElementById('today-appointments');
        const monthAppointments = document.getElementById('month-appointments');

        if (totalPatients) totalPatients.textContent = stats.totalPatients;
        if (todayAppointments) todayAppointments.textContent = stats.todayAppointments;
        if (monthAppointments) monthAppointments.textContent = stats.monthAppointments;
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}