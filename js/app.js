/**
 * Módulo Principal Vitrine Pro
 * Gere o estado global, cálculos e atualizações de interface.
 */

const App = {
    userId: null,
    // Estado inicial: visualização anual ("todos") e ano atual
    currentMonth: 'todos', 
    currentYear: new Date().getFullYear(),
    currentTab: 'resumo',
    
    // Estado global dos dados (armazenados localmente após virem do Firebase)
    state: {
        faturamentos: [],
        despesas: [],
        retiradas: []
    },

    // Referência para o objeto de dados (para compatibilidade com funções de edição)
    data: {
        faturamentos: [],
        despesas: [],
        retiradas: []
    },

    /**
     * Inicializa a aplicação após o login do Firebase
     * @param {string} uid - ID do utilizador vindo do Firebase Auth
     */
    init(uid) {
        this.userId = uid;
        console.log("App Inicializada para o utilizador:", uid);

        // Inicializa os filtros de data na UI
        if (window.UI && window.UI.init) {
            UI.init();
        }
        
        // Inicia a escuta em tempo real do banco de dados para as 3 coleções
        this.startDataListeners();
    },

    /**
     * Configura os listeners do Firestore para atualizações em tempo real
     */
    startDataListeners() {
        const collections = ['faturamentos', 'despesas', 'retiradas'];
        
        collections.forEach(colName => {
            // Database.subscribe utiliza onSnapshot do Firebase
            Database.subscribe(colName, this.userId, (data) => {
                // Atualizamos tanto o estado quanto a referência 'data' para compatibilidade
                this.state[colName] = data;
                this.data[colName] = data;
                this.refreshUI();
            });
        });
    },

    /**
     * Filtra e processa os dados para atualizar todos os componentes da UI
     */
    refreshUI() {
        // 1. Filtrar dados pelo período selecionado (Mês específico ou "Todos")
        const filteredData = {
            faturamentos: this.filterByDate(this.state.faturamentos),
            despesas: this.filterByDate(this.state.despesas),
            retiradas: this.filterByDate(this.state.retiradas)
        };

        // 2. Calcular Totais do Período Filtrado
        const totalF = this.sumValues(filteredData.faturamentos);
        const totalD = this.sumValues(filteredData.despesas);
        const totalR = this.sumValues(filteredData.retiradas);
        const saldoMensal = totalF - totalD - totalR;

        // 3. Atualizar Cards de Resumo com animação ou atualização direta
        this.updateCardValue('total-f', totalF);
        this.updateCardValue('total-d', totalD);
        this.updateCardValue('total-r', totalR);
        this.updateCardValue('saldo-disponivel', saldoMensal);

        // 4. Calcular Limite MEI (Baseado sempre no ANO INTEIRO)
        this.updateMeiStatus();

        // 5. Atualizar Gráfico ou Lista de acordo com a aba ativa
        if (this.currentTab === 'resumo') {
            if (window.UI && UI.updateChart) {
                UI.updateChart(totalF, totalD, totalR);
            }
        } else {
            // Se estiver numa aba de listagem (Vendas, Custos ou Lucros), atualiza a lista
            if (window.UI && UI.renderList) {
                UI.renderList(filteredData[this.currentTab]);
            }
        }
    },

    /**
     * Função auxiliar para atualizar valores nos cards
     */
    updateCardValue(id, val) {
        if (window.UI && UI.animateValue) {
            UI.animateValue(id, val);
        } else {
            const el = document.getElementById(id);
            if (el) {
                el.innerText = val.toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                });
            }
        }
    },

    /**
     * Filtra um array de objetos pela data selecionada.
     * Trata o fuso horário para evitar erros de data.
     */
    filterByDate(dataArray) {
        return dataArray.filter(item => {
            // "T12:00:00" garante que a data não retroceda um dia devido ao fuso horário
            const d = new Date(item.data + 'T12:00:00');
            const itemYear = d.getFullYear();
            const itemMonth = d.getMonth();

            const matchesYear = itemYear === this.currentYear;
            
            // Se for 'todos', retorna todos os meses do ano
            if (this.currentMonth === 'todos' || this.currentMonth === -1) {
                return matchesYear;
            }
            
            // Caso contrário, compara o mês (convertendo para número para garantir)
            return matchesYear && itemMonth === Number(this.currentMonth);
        });
    },

    /**
     * Soma o campo 'valor' de um array de objetos
     */
    sumValues(array) {
        return array.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
    },

    /**
     * Calcula o progresso do limite anual do MEI (R$ 81.000,00)
     * Este cálculo é sempre ANUAL, independente do filtro de mês.
     */
    updateMeiStatus() {
        const faturamentosAno = this.state.faturamentos.filter(item => {
            const d = new Date(item.data + 'T12:00:00');
            return d.getFullYear() === this.currentYear;
        });

        const totalAno = this.sumValues(faturamentosAno);
        const limiteMei = 81000;
        const percent = Math.min((totalAno / limiteMei) * 100, 100).toFixed(1);

        const bar = document.getElementById('mei-bar');
        const labelPercent = document.getElementById('mei-percent');
        const labelTotal = document.getElementById('mei-total-val');

        if (bar) bar.style.width = `${percent}%`;
        if (labelPercent) labelPercent.innerText = `${percent}%`;
        if (labelTotal) {
            labelTotal.innerText = totalAno.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL',
                minimumFractionDigits: 2 
            });
        }
    },

    /**
     * Função chamada pela UI para atualizar os dados (Alias para refreshUI)
     */
    refreshData() {
        // Sincroniza as variáveis locais com as variáveis globais da UI
        if (window.UI) {
            this.currentMonth = UI.activeMonth;
            this.currentYear = UI.activeYear;
            this.currentTab = UI.activeTab;
        }
        this.refreshUI();
    },

    /**
     * Altera o mês de visualização (Chamado pelo ui.js)
     */
    setMonth(m) {
        this.currentMonth = (m === 'todos') ? 'todos' : parseInt(m);
        if (window.UI && UI.updateMonthSelector) {
            UI.updateMonthSelector(this.currentMonth);
        }
        this.refreshUI();
    },

    /**
     * Altera o ano de visualização
     */
    setYear(y) {
        this.currentYear = parseInt(y);
        this.refreshUI();
    }
};

// Exporta o objeto App para ser acessível globalmente pelos eventos do HTML/UI
window.App = App;

// Listener para inicialização via Firebase Auth (se não for inicializado externamente)
firebase.auth().onAuthStateChanged(user => {
    if (user) {
        App.init(user.uid);
    }
});
