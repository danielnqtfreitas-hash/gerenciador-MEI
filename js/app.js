/**
 * Núcleo da Aplicação - Vitrine Pro
 * Gere o estado global, filtros, cálculos financeiros e integração com o Firestore.
 */

const App = {
    user: null,
    userId: null,
    // Estado local para evitar leituras excessivas ao banco de dados
    state: {
        faturamentos: [],
        despesas: [],
        retiradas: []
    },

    /**
     * Inicializa a aplicação após a confirmação do login
     * @param {string} uid - ID único do utilizador do Firebase
     */
    init(uid) {
        this.userId = uid;
        console.log("Sistema Elite inicializado para o utilizador:", uid);

        // Inicia os escutas de dados em tempo real
        this.startDataListeners();

        // Configura a interface inicial
        UI.renderMonthSelector();
        UI.populateYearFilter();
        
        // Regista o Service Worker para suporte PWA (Offline)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .catch(err => console.warn("Service Worker não registado:", err));
        }
    },

    /**
     * Estabelece conexão em tempo real com as coleções do Firestore
     */
    startDataListeners() {
        const collections = ['faturamentos', 'despesas', 'retiradas'];
        
        collections.forEach(col => {
            Database.subscribe(col, this.userId, (docs) => {
                this.state[col] = docs;
                this.refreshUI();
            });
        });
    },

    /**
     * Orquestra a atualização de todos os componentes visuais
     */
    refreshUI() {
        const MEI_LIMIT = 81000;
        
        // 1. Cálculos de Totais Gerais (Saldo em Caixa)
        const totalVendas = this.state.faturamentos.reduce((a, b) => a + (Number(b.valor) || 0), 0);
        const totalGastos = this.state.despesas.reduce((a, b) => a + (Number(b.valor) || 0), 0);
        const totalRetiradas = this.state.retiradas.reduce((a, b) => a + (Number(b.valor) || 0), 0);
        
        const saldoAtual = totalVendas - totalGastos - totalRetiradas;
        UI.animateValue('saldo-disponivel', saldoAtual);

        // 2. Aplicação de Filtros (Ano e Mês selecionados)
        const filterFn = (item) => {
            const date = new Date(item.data + "T00:00:00");
            const matchYear = date.getFullYear() === UI.selectedYear;
            const matchMonth = UI.selectedMonth === null || date.getMonth() === UI.selectedMonth;
            return matchYear && matchMonth;
        };

        const fFiltered = this.state.faturamentos.filter(filterFn);
        const dFiltered = this.state.despesas.filter(filterFn);
        const rFiltered = this.state.retiradas.filter(filterFn);

        // 3. Totais do Período Filtrado
        const tF = fFiltered.reduce((a, b) => a + (Number(b.valor) || 0), 0);
        const tD = dFiltered.reduce((a, b) => a + (Number(b.valor) || 0), 0);
        const tR = rFiltered.reduce((a, b) => a + (Number(b.valor) || 0), 0);

        document.getElementById('total-f').innerText = UI.formatBRL(tF);
        document.getElementById('total-d').innerText = UI.formatBRL(tD);
        document.getElementById('total-r').innerText = UI.formatBRL(tR);

        // 4. Monitorização do Limite MEI (Sempre Anual)
        const fAnualMEI = this.state.faturamentos
            .filter(i => new Date(i.data + "T00:00:00").getFullYear() === UI.selectedYear)
            .reduce((a, b) => a + (Number(b.valor) || 0), 0);
        
        const percentagemMEI = Math.min((fAnualMEI / MEI_LIMIT) * 100, 100);
        document.getElementById('mei-total-val').innerText = UI.formatBRL(fAnualMEI);
        document.getElementById('mei-percent').innerText = `${percentagemMEI.toFixed(1)}%`;
        document.getElementById('mei-bar').style.width = `${percentagemMEI}%`;

        // Cores de alerta para o limite MEI
        if (percentagemMEI > 90) {
            document.getElementById('mei-bar').style.background = 'linear-gradient(90deg, #ff4444, #cc0000)';
        } else {
            document.getElementById('mei-bar').style.background = 'linear-gradient(90deg, #00ff88, #00bd65)';
        }

        // 5. Atualização do Gráfico e Listagens
        UI.renderChart(tF, tD, tR);
        
        if (UI.activeTab !== 'resumo') {
            const map = {
                'faturamentos': fFiltered,
                'despesas': dFiltered,
                'retiradas': rFiltered
            };
            UI.renderItemsList(map[UI.activeTab]);
        }
    }
};

/**
 * Extensão de utilitários da UI para animações
 */
UI.animateValue = function(id, value) {
    const obj = document.getElementById(id);
    const start = parseFloat(obj.innerText.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    const duration = 800;
    let startTime = null;

    function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = progress * (value - start) + start;
        obj.innerText = UI.formatBRL(current);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
};

// Nota: O arranque do App.init() é feito dentro do Auth.js através do onAuthStateChanged.
