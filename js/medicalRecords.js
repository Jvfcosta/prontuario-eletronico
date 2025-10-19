// Módulo de gestão de prontuários
const MedicalRecords = {
    // Estado atual
    currentState: {
        selectedPatientId: null,
        currentPatient: null,
        selectedRecordId: null // NOVO: para controlar qual receita está selecionada
    },

    // Inicializar módulo
    init() {
        this.bindEvents();
    },

    // Vincular eventos
    bindEvents() {
        // Formulário de atendimento
        const recordForm = document.getElementById('record-form');
        if (recordForm) {
            recordForm.addEventListener('submit', (e) => this.handleRecordSubmit(e));
        }

        // Botões de impressão
        const printPrescriptionBtn = document.getElementById('print-prescription');
        const printReferralBtn = document.getElementById('print-referral');
        
        if (printPrescriptionBtn) {
            printPrescriptionBtn.addEventListener('click', () => this.printPrescription());
        }
        
        if (printReferralBtn) {
            printReferralBtn.addEventListener('click', () => this.printReferral());
        }

        // Busca no modal
        const modalSearch = document.getElementById('modal-patient-search');
        if (modalSearch) {
            modalSearch.addEventListener('input', 
                Utils.debounce((e) => this.handleModalSearch(e), 300)
            );
        }
    },

    // Manipular envio do formulário de atendimento
    async handleRecordSubmit(e) {
        e.preventDefault();

        if (!this.currentState.selectedPatientId) {
            Utils.showAlert('record-alert', 'Por favor, selecione um paciente primeiro.', 'error');
            this.showPatientSelectModal();
            return;
        }

        const formData = new FormData(e.target);
        
        // CORREÇÃO: Usar data atual correta (sem problemas de timezone)
        const dataAtendimento = formData.get('data-atendimento') || Utils.getCurrentDate();
        
        const recordData = {
            patientId: this.currentState.selectedPatientId,
            dataAtendimento: dataAtendimento, // Usando data corrigida
            queixaPrincipal: formData.get('queixa-principal'),
            evolucaoClinica: formData.get('evolucao-clinica'),
            prescricao: formData.get('prescricao'),
            medico: Auth.getCurrentUser()?.username || 'Médico'
        };

        // Validar dados
        if (!this.validateRecordData(recordData)) {
            return;
        }

        try {
            await this.createRecord(recordData);
            e.target.reset();
            
            // CORREÇÃO: Usar data atual correta no campo
            document.getElementById('data-atendimento').value = Utils.getCurrentDate();
            
            // Recarregar histórico
            await this.loadPatientRecords(this.currentState.selectedPatientId);
            
        } catch (error) {
            console.error('Erro ao salvar atendimento:', error);
            Utils.showAlert('record-alert', 'Erro ao salvar atendimento', 'error');
        }
    },

    // Validar dados do atendimento
    validateRecordData(record) {
        if (!record.dataAtendimento) {
            Utils.showAlert('record-alert', 'Data do atendimento é obrigatória', 'error');
            return false;
        }

        if (!record.queixaPrincipal || record.queixaPrincipal.trim().length < 10) {
            Utils.showAlert('record-alert', 'Queixa principal deve ter pelo menos 10 caracteres', 'error');
            return false;
        }

        if (!record.evolucaoClinica || record.evolucaoClinica.trim().length < 10) {
            Utils.showAlert('record-alert', 'Evolução clínica deve ter pelo menos 10 caracteres', 'error');
            return false;
        }

        if (!record.prescricao || record.prescricao.trim().length < 5) {
            Utils.showAlert('record-alert', 'Prescrição deve ter pelo menos 5 caracteres', 'error');
            return false;
        }

        return true;
    },

    // Criar novo registro de atendimento
    async createRecord(recordData) {
        const records = Database.getMedicalRecords();
        
        const newRecord = {
            id: Utils.generateId(),
            ...recordData,
            dataRegistro: new Date().toISOString()
        };

        records.push(newRecord);
        
        if (Database.saveMedicalRecords(records)) {
            Utils.showAlert('record-alert', 'Atendimento registrado com sucesso!', 'success');
            return newRecord;
        } else {
            throw new Error('Falha ao salvar atendimento');
        }
    },

    // Carregar histórico do paciente
    async loadPatientRecords(patientId) {
        try {
            const records = Database.getRecordsByPatient(patientId)
                .sort((a, b) => new Date(b.dataAtendimento) - new Date(a.dataAtendimento));
            
            this.renderRecordHistory(records);
            
            // NOVO: Selecionar automaticamente o último atendimento
            if (records.length > 0) {
                this.currentState.selectedRecordId = records[0].id;
            }
            
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            Utils.showAlert('record-alert', 'Erro ao carregar histórico', 'error');
        }
    },

    // Renderizar histórico de atendimentos
    renderRecordHistory(records) {
        const recordHistory = document.getElementById('record-history');
        if (!recordHistory) return;

        if (records.length === 0) {
            recordHistory.innerHTML = `
                <div class="record-item">
                    <p>Nenhum atendimento registrado para este paciente.</p>
                </div>
            `;
            return;
        }

        recordHistory.innerHTML = records.map(record => `
            <div class="record-item ${this.currentState.selectedRecordId === record.id ? 'selected-record' : ''}" 
                 data-record-id="${record.id}">
                <div class="record-header">
                    <div class="record-date">
                        ${Utils.formatDate(record.dataAtendimento)} - Dr. ${Utils.sanitizeInput(record.medico)}
                    </div>
                    <div class="record-actions">
                        <button class="btn btn-small" onclick="MedicalRecords.selectRecordForPrint('${record.id}')">
                            ${this.currentState.selectedRecordId === record.id ? '✅ Selecionado' : 'Selecionar para Impressão'}
                        </button>
                    </div>
                </div>
                <div class="record-content">
                    <h4>Queixa Principal / Anamnese</h4>
                    <p>${Utils.sanitizeInput(record.queixaPrincipal)}</p>
                </div>
                <div class="record-content">
                    <h4>Evolução Clínica / Conduta</h4>
                    <p>${Utils.sanitizeInput(record.evolucaoClinica)}</p>
                </div>
                <div class="record-content">
                    <h4>Prescrição/Recomendação</h4>
                    <p>${Utils.sanitizeInput(record.prescricao)}</p>
                </div>
            </div>
        `).join('');
    },

    // NOVO: Selecionar registro para impressão
    selectRecordForPrint(recordId) {
        this.currentState.selectedRecordId = recordId;
        
        // Atualizar visualmente qual está selecionado
        document.querySelectorAll('.record-item').forEach(item => {
            item.classList.remove('selected-record');
        });
        
        const selectedItem = document.querySelector(`[data-record-id="${recordId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected-record');
            
            // Atualizar texto do botão
            const button = selectedItem.querySelector('.record-actions button');
            if (button) {
                button.textContent = '✅ Selecionado';
            }
        }
        
        Utils.showAlert('record-alert', 'Receita selecionada para impressão!', 'success');
    },

    // Mostrar modal de seleção de paciente
    showPatientSelectModal() {
        this.renderModalPatientList();
        UI.showModal('patient-select-modal');
    },

    // Fechar modal de seleção de paciente
    closePatientSelectModal() {
        UI.hideModal('patient-select-modal');
    },

    // Manipular busca no modal
    handleModalSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const patients = Patients.getPatientForSelection();
        
        const filtered = patients.filter(patient => 
            patient.nome.toLowerCase().includes(searchTerm) ||
            patient.cpf.includes(searchTerm)
        );
        
        this.renderModalPatientList(filtered);
    },

    // Renderizar lista de pacientes no modal
    renderModalPatientList(patients = null) {
        const modalPatientList = document.getElementById('modal-patient-list');
        if (!modalPatientList) return;

        const patientsToShow = patients || Patients.getPatientForSelection();

        if (patientsToShow.length === 0) {
            modalPatientList.innerHTML = `
                <div class="patient-item">
                    <p>Nenhum paciente encontrado</p>
                </div>
            `;
            return;
        }

        modalPatientList.innerHTML = patientsToShow.map(patient => `
            <div class="patient-item">
                <div class="patient-info">
                    <h3>${Utils.sanitizeInput(patient.nome)}</h3>
                    <p>CPF: ${patient.cpf} | Data de Nascimento: ${Utils.formatDate(patient.dataNascimento)}</p>
                </div>
                <div class="patient-actions">
                    <button class="btn" onclick="MedicalRecords.selectPatient('${patient.id}')">Selecionar</button>
                </div>
            </div>
        `).join('');
    },

    // Selecionar paciente
    selectPatient(patientId) {
        const patient = Database.getPatientById(patientId);
        if (!patient) {
            Utils.showAlert('record-alert', 'Paciente não encontrado', 'error');
            return;
        }

        this.currentState.selectedPatientId = patientId;
        this.currentState.currentPatient = patient;
        this.currentState.selectedRecordId = null; // Resetar seleção de receita

        // Atualizar interface
        this.updatePatientInfo(patient);
        
        // Carregar histórico
        this.loadPatientRecords(patientId);
        
        // Fechar modal
        this.closePatientSelectModal();
    },

    // Atualizar informações do paciente na interface
    updatePatientInfo(patient) {
        const patientName = document.getElementById('patient-name');
        const patientInfo = document.getElementById('patient-info');
        
        if (patientName) {
            patientName.textContent = patient.nome;
        }
        
        if (patientInfo) {
            const age = Utils.calculateAge(patient.dataNascimento);
            patientInfo.textContent = `Idade: ${age} anos | CPF: ${patient.cpf}`;
        }
    },

    // Imprimir receita
    printPrescription() {
        if (!this.currentState.selectedPatientId) {
            Utils.showAlert('record-alert', 'Por favor, selecione um paciente primeiro.', 'error');
            return;
        }

        // NOVO: Verificar se há uma receita selecionada
        if (!this.currentState.selectedRecordId) {
            Utils.showAlert('record-alert', 'Por favor, selecione um atendimento para imprimir a receita.', 'error');
            return;
        }

        const records = Database.getRecordsByPatient(this.currentState.selectedPatientId);
        const selectedRecord = records.find(record => record.id === this.currentState.selectedRecordId);
        
        if (!selectedRecord) {
            Utils.showAlert('record-alert', 'Atendimento selecionado não encontrado.', 'error');
            return;
        }

        this.generatePrescriptionPrint(this.currentState.currentPatient, selectedRecord);
    },

    // Imprimir encaminhamento
    printReferral() {
        if (!this.currentState.selectedPatientId) {
            Utils.showAlert('record-alert', 'Por favor, selecione um paciente primeiro.', 'error');
            return;
        }

        this.generateReferralPrint(this.currentState.currentPatient);
    },

    // Gerar receita para impressão
    generatePrescriptionPrint(patient, record) {
        const printWindow = window.open('', '_blank');
        const currentUser = Auth.getCurrentUser();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receita Médica - ${patient.nome}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .patient-info { 
                        margin-bottom: 30px;
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .prescription { 
                        margin: 30px 0;
                        min-height: 300px;
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 5px;
                    }
                    .footer { 
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature { 
                        text-align: center;
                    }
                    .signature-line { 
                        width: 300px; 
                        border-top: 1px solid #000; 
                        margin: 40px auto 10px;
                    }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Receita Médica</h1>
                </div>
                
                <div class="patient-info">
                    <p><strong>Paciente:</strong> ${Utils.sanitizeInput(patient.nome)}</p>
                    <p><strong>Data de Nascimento:</strong> ${Utils.formatDate(patient.dataNascimento)}</p>
                    <p><strong>CPF:</strong> ${patient.cpf}</p>
                    <p><strong>Data da Consulta:</strong> ${Utils.formatDate(record.dataAtendimento)}</p>
                </div>
                
                <div class="prescription">
                    <h3>PRESCRIÇÃO MÉDICA:</h3>
                    <div style="white-space: pre-line;">${Utils.sanitizeInput(record.prescricao)}</div>
                </div>
                
                <div class="footer">
                    <div class="signature">
                        <div class="signature-line"></div>
                        <p>Dr. ${currentUser?.username || 'Médico'}</p>
                        <p>CRM: XXXXXX-XX</p>
                    </div>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Imprimir Receita
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        Fechar
                    </button>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    },

    // Gerar encaminhamento para impressão
    generateReferralPrint(patient) {
        const printWindow = window.open('', '_blank');
        const currentUser = Auth.getCurrentUser();
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Encaminhamento Médico - ${patient.nome}</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 40px;
                        line-height: 1.6;
                        color: #333;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .patient-info { 
                        margin-bottom: 30px;
                        background: #f9f9f9;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .referral { 
                        margin: 30px 0;
                        min-height: 300px;
                        border: 1px solid #ddd;
                        padding: 20px;
                        border-radius: 5px;
                    }
                    .footer { 
                        margin-top: 50px;
                        display: flex;
                        justify-content: space-between;
                    }
                    .signature { 
                        text-align: center;
                    }
                    .signature-line { 
                        width: 300px; 
                        border-top: 1px solid #000; 
                        margin: 40px auto 10px;
                    }
                    .form-field {
                        margin: 20px 0;
                    }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Encaminhamento Médico</h1>
                </div>
                
                <div class="patient-info">
                    <p><strong>Paciente:</strong> ${Utils.sanitizeInput(patient.nome)}</p>
                    <p><strong>Data de Nascimento:</strong> ${Utils.formatDate(patient.dataNascimento)}</p>
                    <p><strong>CPF:</strong> ${patient.cpf}</p>
                    <p><strong>Data do Encaminhamento:</strong> ${Utils.formatDate(new Date())}</p>
                </div>
                
                <div class="referral">
                    <div class="form-field">
                        <p><strong>Encaminho o(a) paciente acima para:</strong></p>
                        <p style="border-bottom: 1px solid #333; min-height: 25px; margin-top: 10px;"></p>
                    </div>
                    
                    <div class="form-field">
                        <p><strong>Especialidade/Profissional:</strong></p>
                        <p style="border-bottom: 1px solid #333; min-height: 25px; margin-top: 10px;"></p>
                    </div>
                    
                    <div class="form-field">
                        <p><strong>Motivo do encaminhamento:</strong></p>
                        <div style="border: 1px solid #ddd; min-height: 150px; margin-top: 10px; padding: 10px;"></div>
                    </div>
                    
                    <div class="form-field">
                        <p><strong>Observações:</strong></p>
                        <div style="border: 1px solid #ddd; min-height: 100px; margin-top: 10px; padding: 10px;"></div>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="signature">
                        <div class="signature-line"></div>
                        <p>Dr. ${currentUser?.username || 'Médico'}</p>
                        <p>CRM: XXXXXX-XX</p>
                    </div>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Imprimir Encaminhamento
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
                        Fechar
                    </button>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicalRecords;
}