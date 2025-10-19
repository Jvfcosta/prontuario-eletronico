// Módulo de banco de dados
const Database = {
    // Chaves para armazenamento
    KEYS: {
        PATIENTS: 'patients',
        MEDICAL_RECORDS: 'medicalRecords',
        USER_SESSION: 'userSession',
        SYSTEM_CONFIG: 'systemConfig'
    },

    // Inicializar banco de dados
    init() {
        try {
            // Verificar se o localStorage está disponível
            if (!this.isLocalStorageAvailable()) {
                throw new Error('LocalStorage não está disponível');
            }
            
            // Inicializar estruturas se não existirem
            this.initializeStructures();
            
            console.log('Banco de dados inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar banco de dados:', error);
            return false;
        }
    },

    // Verificar se localStorage está disponível
    isLocalStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    // Inicializar estruturas de dados
    initializeStructures() {
        if (!localStorage.getItem(this.KEYS.PATIENTS)) {
            localStorage.setItem(this.KEYS.PATIENTS, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.KEYS.MEDICAL_RECORDS)) {
            localStorage.setItem(this.KEYS.MEDICAL_RECORDS, JSON.stringify([]));
        }
        
        if (!localStorage.getItem(this.KEYS.SYSTEM_CONFIG)) {
            localStorage.setItem(this.KEYS.SYSTEM_CONFIG, JSON.stringify({
                version: '1.0.0',
                lastBackup: null,
                settings: {}
            }));
        }
    },

    // =============================================
    // OPERAÇÕES PARA PACIENTES
    // =============================================
    
    // Obter todos os pacientes
    getPatients() {
        try {
            const patients = localStorage.getItem(this.KEYS.PATIENTS);
            return patients ? JSON.parse(patients) : [];
        } catch (error) {
            console.error('Erro ao obter pacientes:', error);
            return [];
        }
    },

    // Salvar pacientes
    savePatients(patients) {
        try {
            localStorage.setItem(this.KEYS.PATIENTS, JSON.stringify(patients));
            return true;
        } catch (error) {
            console.error('Erro ao salvar pacientes:', error);
            return false;
        }
    },

    // Buscar paciente por ID
    getPatientById(id) {
        const patients = this.getPatients();
        return patients.find(patient => patient.id === id) || null;
    },

    // Buscar pacientes por termo
    searchPatients(term) {
        const patients = this.getPatients();
        const searchTerm = term.toLowerCase();
        
        return patients.filter(patient => 
            patient.nome.toLowerCase().includes(searchTerm) ||
            patient.cpf.includes(searchTerm) ||
            patient.nomeMae.toLowerCase().includes(searchTerm)
        );
    },

    // =============================================
    // OPERAÇÕES PARA REGISTROS MÉDICOS
    // =============================================
    
    // Obter todos os registros médicos
    getMedicalRecords() {
        try {
            const records = localStorage.getItem(this.KEYS.MEDICAL_RECORDS);
            return records ? JSON.parse(records) : [];
        } catch (error) {
            console.error('Erro ao obter registros médicos:', error);
            return [];
        }
    },

    // Salvar registros médicos
    saveMedicalRecords(records) {
        try {
            localStorage.setItem(this.KEYS.MEDICAL_RECORDS, JSON.stringify(records));
            return true;
        } catch (error) {
            console.error('Erro ao salvar registros médicos:', error);
            return false;
        }
    },

    // Obter registros por paciente
    getRecordsByPatient(patientId) {
        const records = this.getMedicalRecords();
        return records.filter(record => record.patientId === patientId);
    },

    // Obter registros por data
    getRecordsByDate(date) {
        const records = this.getMedicalRecords();
        return records.filter(record => record.dataAtendimento === date);
    },

    // =============================================
    // OPERAÇÕES PARA SESSÃO DO USUÁRIO
    // =============================================
    
    // Salvar sessão do usuário
    saveUserSession(user) {
        try {
            localStorage.setItem(this.KEYS.USER_SESSION, JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('Erro ao salvar sessão:', error);
            return false;
        }
    },

    // Obter sessão do usuário
    getUserSession() {
        try {
            const session = localStorage.getItem(this.KEYS.USER_SESSION);
            return session ? JSON.parse(session) : null;
        } catch (error) {
            console.error('Erro ao obter sessão:', error);
            return null;
        }
    },

    // Limpar sessão do usuário
    clearUserSession() {
        try {
            localStorage.removeItem(this.KEYS.USER_SESSION);
            return true;
        } catch (error) {
            console.error('Erro ao limpar sessão:', error);
            return false;
        }
    },

    // =============================================
    // BACKUP E RESTAURAÇÃO
    // =============================================
    
    // Exportar dados completos
    exportData() {
        return {
            patients: this.getPatients(),
            medicalRecords: this.getMedicalRecords(),
            systemConfig: JSON.parse(localStorage.getItem(this.KEYS.SYSTEM_CONFIG) || '{}'),
            exportDate: new Date().toISOString()
        };
    },

    // Importar dados
    importData(data) {
        try {
            if (data.patients) {
                this.savePatients(data.patients);
            }
            
            if (data.medicalRecords) {
                this.saveMedicalRecords(data.medicalRecords);
            }
            
            if (data.systemConfig) {
                localStorage.setItem(this.KEYS.SYSTEM_CONFIG, JSON.stringify(data.systemConfig));
            }
            
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    },

    // Fazer backup
    backup() {
        const data = this.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-prontuario-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    // Restaurar de arquivo
    async restore(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (this.importData(data)) {
                        resolve(true);
                    } else {
                        reject(new Error('Erro ao importar dados'));
                    }
                } catch (error) {
                    reject(new Error('Arquivo inválido'));
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsText(file);
        });
    },

    // =============================================
    // ESTATÍSTICAS
    // =============================================
    
    // Obter estatísticas
    getStatistics() {
        const patients = this.getPatients();
        const records = this.getMedicalRecords();
        const today = new Date().toISOString().split('T')[0];
        
        const todayRecords = records.filter(record => record.dataAtendimento === today);
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthRecords = records.filter(record => {
            const recordDate = new Date(record.dataAtendimento);
            return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
        });
        
        return {
            totalPatients: patients.length,
            todayAppointments: todayRecords.length,
            monthAppointments: monthRecords.length,
            totalRecords: records.length
        };
    }
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Database;
}