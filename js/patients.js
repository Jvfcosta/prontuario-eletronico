// Módulo de gestão de pacientes
const Patients = {
    // Estado atual
    currentState: {
        editingPatientId: null,
        searchTerm: '',
        filteredPatients: []
    },

    // Inicializar módulo
    init() {
        this.bindEvents();
        this.loadPatients();
    },

    // Vincular eventos
    bindEvents() {
        // Formulário de paciente
        const patientForm = document.getElementById('patient-form');
        if (patientForm) {
            patientForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Busca de pacientes
        const patientSearch = document.getElementById('patient-search');
        if (patientSearch) {
            patientSearch.addEventListener('input', 
                Utils.debounce((e) => this.handleSearch(e), 300)
            );
        }
    },

    // Carregar lista de pacientes
    async loadPatients() {
        try {
            const patients = Database.getPatients();
            this.renderPatientList(patients);
            this.currentState.filteredPatients = patients;
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            Utils.showAlert('patient-alert', 'Erro ao carregar lista de pacientes', 'error');
        }
    },

    // Manipular envio do formulário
    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const patientData = {
            nome: formData.get('nome'),
            dataNascimento: formData.get('data-nascimento'),
            cpf: formData.get('cpf'),
            nomeMae: formData.get('nome-mae'),
            celular: formData.get('celular'),
            endereco: formData.get('endereco'),
            numeroEndereco: formData.get('numero-endereco'),
            complemento: formData.get('complemento')
        };

        // Validar dados
        if (!this.validatePatientData(patientData)) {
            return;
        }

        try {
            if (this.currentState.editingPatientId) {
                await this.updatePatient(this.currentState.editingPatientId, patientData);
            } else {
                await this.createPatient(patientData);
            }
            
            e.target.reset();
            this.currentState.editingPatientId = null;
            await this.loadPatients();
            
        } catch (error) {
            console.error('Erro ao salvar paciente:', error);
            Utils.showAlert('patient-alert', 'Erro ao salvar paciente', 'error');
        }
    },

    // Validar dados do paciente
    validatePatientData(patient) {
        if (!patient.nome || patient.nome.trim().length < 3) {
            Utils.showAlert('patient-alert', 'Nome deve ter pelo menos 3 caracteres', 'error');
            return false;
        }

        if (!Utils.validateCPF(patient.cpf)) {
            Utils.showAlert('patient-alert', 'CPF inválido', 'error');
            return false;
        }

        if (!patient.dataNascimento) {
            Utils.showAlert('patient-alert', 'Data de nascimento é obrigatória', 'error');
            return false;
        }

        // Verificar se CPF já existe (apenas para novos pacientes)
        if (!this.currentState.editingPatientId) {
            const existingPatient = this.findPatientByCPF(patient.cpf);
            if (existingPatient) {
                Utils.showAlert('patient-alert', 'CPF já cadastrado', 'error');
                return false;
            }
        }

        return true;
    },

    // Criar novo paciente
    async createPatient(patientData) {
        const patients = Database.getPatients();
        
        const newPatient = {
            id: Utils.generateId(),
            ...patientData,
            dataCadastro: new Date().toISOString()
        };

        patients.push(newPatient);
        
        if (Database.savePatients(patients)) {
            Utils.showAlert('patient-alert', 'Paciente cadastrado com sucesso!', 'success');
            return newPatient;
        } else {
            throw new Error('Falha ao salvar paciente');
        }
    },

    // Atualizar paciente existente
    async updatePatient(patientId, patientData) {
        const patients = Database.getPatients();
        const patientIndex = patients.findIndex(p => p.id === patientId);
        
        if (patientIndex === -1) {
            throw new Error('Paciente não encontrado');
        }

        patients[patientIndex] = {
            ...patients[patientIndex],
            ...patientData,
            dataAtualizacao: new Date().toISOString()
        };

        if (Database.savePatients(patients)) {
            Utils.showAlert('patient-alert', 'Paciente atualizado com sucesso!', 'success');
            return patients[patientIndex];
        } else {
            throw new Error('Falha ao atualizar paciente');
        }
    },

    // Excluir paciente
    async deletePatient(patientId) {
        if (!confirm('Tem certeza que deseja excluir este paciente?')) {
            return;
        }

        try {
            const patients = Database.getPatients().filter(p => p.id !== patientId);
            
            // Também excluir registros médicos associados
            const records = Database.getMedicalRecords();
            const updatedRecords = records.filter(r => r.patientId !== patientId);
            
            if (Database.savePatients(patients) && Database.saveMedicalRecords(updatedRecords)) {
                Utils.showAlert('patient-alert', 'Paciente excluído com sucesso!', 'success');
                await this.loadPatients();
            } else {
                throw new Error('Falha ao excluir paciente');
            }
        } catch (error) {
            console.error('Erro ao excluir paciente:', error);
            Utils.showAlert('patient-alert', 'Erro ao excluir paciente', 'error');
        }
    },

    // Editar paciente
    editPatient(patientId) {
        const patient = Database.getPatientById(patientId);
        if (!patient) {
            Utils.showAlert('patient-alert', 'Paciente não encontrado', 'error');
            return;
        }

        // Preencher formulário
        document.getElementById('nome').value = patient.nome;
        document.getElementById('data-nascimento').value = patient.dataNascimento;
        document.getElementById('cpf').value = patient.cpf;
        document.getElementById('nome-mae').value = patient.nomeMae;
        document.getElementById('celular').value = patient.celular;
        document.getElementById('endereco').value = patient.endereco;
        document.getElementById('numero-endereco').value = patient.numeroEndereco;
        document.getElementById('complemento').value = patient.complemento || '';

        this.currentState.editingPatientId = patientId;

        // Navegar para a seção de cadastro
        UI.showSection('cadastro-paciente');
        UI.updateNavigation('cadastro-paciente');
    },

    // Buscar pacientes
    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        this.currentState.searchTerm = searchTerm;
        
        if (!searchTerm) {
            this.renderPatientList(this.currentState.filteredPatients);
            return;
        }

        const filtered = Database.searchPatients(searchTerm);
        this.renderPatientList(filtered);
    },

    // Encontrar paciente por CPF
    findPatientByCPF(cpf) {
        const patients = Database.getPatients();
        return patients.find(patient => patient.cpf === cpf);
    },

    // Renderizar lista de pacientes
    renderPatientList(patients) {
        const patientList = document.getElementById('patient-list');
        if (!patientList) return;

        if (patients.length === 0) {
            patientList.innerHTML = `
                <div class="patient-item">
                    <p>${this.currentState.searchTerm ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}</p>
                </div>
            `;
            return;
        }

        patientList.innerHTML = patients.map(patient => `
            <div class="patient-item">
                <div class="patient-info">
                    <h3>${Utils.sanitizeInput(patient.nome)}</h3>
                    <p>CPF: ${patient.cpf} | Data de Nascimento: ${Utils.formatDate(patient.dataNascimento)}</p>
                    <p>Mãe: ${Utils.sanitizeInput(patient.nomeMae)} | Celular: ${patient.celular}</p>
                </div>
                <div class="patient-actions">
                    <button class="btn" onclick="Patients.editPatient('${patient.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="Patients.deletePatient('${patient.id}')">Excluir</button>
                </div>
            </div>
        `).join('');
    },

    // Obter paciente para seleção no prontuário
    getPatientForSelection() {
        return Database.getPatients().map(patient => ({
            id: patient.id,
            nome: patient.nome,
            cpf: patient.cpf,
            dataNascimento: patient.dataNascimento
        }));
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Patients;
}