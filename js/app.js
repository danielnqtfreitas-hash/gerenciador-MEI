/**
 * Módulo Principal Vitrine Pro
 * Gere o estado global, cálculos e atualizações de interface.
 */

const App = {
    userId: null,
    currentMonth: new Date().getMonth(), // 0-11
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
        UI.initDateFilters();
        
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

        // 2. Calcular Totais do Mês
        const totalF = this.sumValues(filteredData.faturamentos);
        const totalD = this.sumValues(filteredData.despesas);
        const totalR = this.sumValues(filteredData.retiradas);
        const saldoMensal = totalF - totalD - totalR;

        // 3. Atualizar Cards de Resumo
        UI.animateValue('total-f', totalF);
        UI.animateValue('total-d', totalD);
        UI.animateValue('total-r', totalR);
        UI.animateValue('saldo-disponivel', saldoMensal);

        // 4. Calcular Limite MEI (Baseado no Ano Inteiro)
        this.updateMeiStatus();

        // 5. Atualizar Gráfico (Se estiver na aba resumo)
        if (this.currentTab === 'resumo') {
            UI.updateChart(this.getChartData());
        } else {
            // Se estiver numa aba de listagem, atualiza a lista
            UI.renderList(filteredData[this.currentTab], this.currentTab);
        }
    },

    /**
     * Filtra um array de objetos pela data selecionada no estado
     */
    filterByDate(dataArray) {
        return dataArray.filter(item => {
            const d = new Date(item.data);
            return d.getMonth() === this.currentMonth && d.getFullYear() === this.currentYear;
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
        if (labelTotal) labelTotal.innerText = `R$ ${totalAno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    },

    /**
     * Gera os dados formatados para o Chart.js
     */
    getChartData() {
        // Agrupa totais por dia ou categoria para o gráfico
        // Exemplo simplificado: Comparativo Entradas vs Saídas do mês atual
        const totalEntradas = this.sumValues(this.filterByDate(this.state.faturamentos));
        const totalSaidas = this.sumValues(this.filterByDate(this.state.despesas)) + 
                            this.sumValues(this.filterByDate(this.state.retiradas));

        return {
            labels: ['Entradas', 'Saídas'],
            datasets: [{
                data: [totalEntradas, totalSaidas],
                backgroundColor: ['#00ff88', '#ef4444'],
                borderWidth: 0
            }]
        };
    },

    /**
     * Altera o mês de visualização
     */
    setMonth(m) {
        this.currentMonth = parseInt(m);
        UI.updateMonthSelector(this.currentMonth);
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

// Exporta para uso global nos eventos de clique do HTML
window.App = App;
