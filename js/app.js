/**
 * Módulo Principal Vitrine Pro
 * Gere o estado global, cálculos e atualizações de interface.
 */

const App = {
    userId: null,
    currentMonth: 'todos', // Define "Todos" como padrão inicial
    currentYear: new Date().getFullYear(),
    currentTab: 'resumo',
    
    // Estado global dos dados
    state: {
        faturamentos: [],
        despesas: [],
        retiradas: []
    },

    /**
     * Inicializa a aplicação após o login
     * @param {string} uid - ID do utilizador vindo do Firebase Auth
     */
    init(uid) {
        this.userId = uid;
        console.log("App Inicializada para o utilizador:", uid);

        // Configura os filtros de data na UI
        if (UI.initDateFilters) {
            UI.initDateFilters();
        } else if (UI.init) {
            UI.init();
        }
        
        // Inicia a escuta em tempo real do banco de dados
        this.startDataListeners();
    },

    /**
     * Configura os listeners do Firestore para atualizações em tempo real
     */
    startDataListeners() {
        const collections = ['faturamentos', 'despesas', 'retiradas'];
        
        collections.forEach(colName => {
            // Database.subscribe deve estar definido em js/database.js
            Database.subscribe(colName, this.userId, (data) => {
                this.state[colName] = data;
                this.refreshUI();
            });
        });
    },

    /**
     * Filtra e processa os dados para atualizar todos os componentes da UI
     */
    refreshUI() {
        // 1. Filtrar dados pelo mês e ano selecionados
        const filteredData = {
            faturamentos: this.filterByDate(this.state.faturamentos),
            despesas: this.filterByDate(this.state.despesas),
            retiradas: this.filterByDate(this.state.retiradas)
        };

        // 2. Calcular Totais do Período (Mês selecionado ou Ano inteiro se for 'todos')
        const totalF = this.sumValues(filteredData.faturamentos);
        const totalD = this.sumValues(filteredData.despesas);
        const totalR = this.sumValues(filteredData.retiradas);
        const saldoPeriodo = totalF - totalD - totalR;

        // 3. Atualizar Cards de Resumo na UI
        // Verifica se a função animateValue ou setCurrencyValue existe
        if (UI.animateValue) {
            UI.animateValue('total-f', totalF);
            UI.animateValue('total-d', totalD);
            UI.animateValue('total-r', totalR);
            UI.animateValue('saldo-disponivel', saldoPeriodo);
        } else if (typeof UI.setCurrencyValue === 'function') {
            UI.setCurrencyValue('total-f', totalF);
            UI.setCurrencyValue('total-d', totalD);
            UI.setCurrencyValue('total-r', totalR);
            UI.setCurrencyValue('saldo-disponivel', saldoPeriodo);
        } else {
            // Fallback direto caso as funções não existam
            this.updateElementCurrency('total-f', totalF);
            this.updateElementCurrency('total-d', totalD);
            this.updateElementCurrency('total-r', totalR);
            this.updateElementCurrency('saldo-disponivel', saldoPeriodo);
        }

        // 4. Calcular Limite MEI (Sempre baseado no Ano Inteiro)
        this.updateMeiStatus();

        // 5. Atualizar Gráfico ou Lista
        if (this.currentTab === 'resumo') {
            const chartData = this.getChartData(totalF, totalD, totalR);
            if (UI.updateChart) UI.updateChart(chartData);
        } else {
            // Se estiver numa aba de listagem, atualiza a lista
            if (UI.renderList) {
                UI.renderList(filteredData[this.currentTab], this.currentTab);
            }
        }
    },

    /**
     * Filtra um array de objetos pela data selecionada no estado
     */
    filterByDate(dataArray) {
        return dataArray.filter(item => {
            const d = new Date(item.data);
            const matchesYear = d.getFullYear() === this.currentYear;
            
            // Lógica para o filtro "Todos"
            if (this.currentMonth === 'todos' || this.currentMonth === -1) {
                return matchesYear;
            }
            
            return matchesYear && d.getMonth() === this.currentMonth;
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
     */
    updateMeiStatus() {
        const faturamentosAno = this.state.faturamentos.filter(item => {
            return new Date(item.data).getFullYear() === this.currentYear;
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
     * Gera os dados formatados para o Chart.js com 3 categorias
     */
    getChartData(f, d, r) {
        // Estrutura para o gráfico de rosca (Doughnut) conforme o design premium
        return {
            labels: ['Vendas', 'Custos', 'Lucros'],
            datasets: [{
                data: [f, d, r],
                backgroundColor: ['#00ff88', '#ef4444', '#a855f7'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        };
    },

    /**
     * Altera o mês de visualização (chamado pelo clique nos botões da UI)
     */
    setMonth(m) {
        // Se m for 'todos', mantemos como string, caso contrário convertemos para inteiro
        this.currentMonth = (m === 'todos') ? 'todos' : parseInt(m);
        
        if (UI.updateMonthSelector) {
            UI.updateMonthSelector(this.currentMonth);
        }
        this.refreshUI();
    },

    /**
     * Alias para compatibilidade com o ui.js (caso chame UI.selectMonth)
     */
    refreshData() {
        // Mapeia os valores da UI para o estado local do App
        if (typeof UI.activeMonth !== 'undefined') this.currentMonth = UI.activeMonth;
        if (typeof UI.activeYear !== 'undefined') this.currentYear = UI.activeYear;
        if (typeof UI.activeTab !== 'undefined') this.currentTab = UI.activeTab;
        
        this.refreshUI();
    },

    /**
     * Altera o ano de visualização
     */
    setYear(y) {
        this.currentYear = parseInt(y);
        this.refreshUI();
    },

    /**
     * Fallback para atualizar valores monetários
     */
    updateElementCurrency(id, val) {
        const el = document.getElementById(id);
        if (el) {
            el.innerText = val.toLocaleString('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            });
        }
    }
};

// Exporta para uso global
window.App = App;
