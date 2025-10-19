// Módulo de utilitários
const Utils = {
    // Formatar data CORRIGIDO - problema de timezone
    formatDate(dateString) {
        if (!dateString) return '';
        
        // Corrigir problema de timezone - garantir que use UTC
        const date = new Date(dateString);
        
        // Se a data não tiver timezone, assumir que é UTC
        if (dateString.includes('T')) {
            // Data ISO - manter como está
            return date.toLocaleDateString('pt-BR');
        } else {
            // Data sem timezone (YYYY-MM-DD) - criar data em UTC
            const [year, month, day] = dateString.split('-');
            const utcDate = new Date(Date.UTC(year, month - 1, day));
            return utcDate.toLocaleDateString('pt-BR');
        }
    },

    // Obter data atual no formato YYYY-MM-DD (corrigido)
    getCurrentDate() {
        const now = new Date();
        
        // Usar UTC para evitar problemas de timezone
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    // Converter data para formato de input date (YYYY-MM-DD)
    formatDateForInput(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    },

    // Restante do código permanece igual...
    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    validateCPF(cpf) {
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;
        return cpfRegex.test(cpf);
    },

    formatCPF(cpf) {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },

    showAlert(elementId, message, type = 'success') {
        const alertElement = document.getElementById(elementId);
        if (!alertElement) return;
        
        alertElement.textContent = message;
        alertElement.className = `alert alert-${type}`;
        alertElement.style.display = 'block';
        
        setTimeout(() => {
            alertElement.style.display = 'none';
        }, 5000);
    },

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    sanitizeInput(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    formatPhone(phone) {
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}