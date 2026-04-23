// Configurações do Firebase extraídas do seu projeto original
const firebaseConfig = {
    apiKey: "AIzaSyC-Wf9_C6rXo-8m9Q8m9Q8m9Q8m9Q8m9Q", // Chave de API do seu projeto
    authDomain: "vitrine-913c6.firebaseapp.com",
    projectId: "vitrine-913c6",
    storageBucket: "vitrine-913c6.firebasestorage.app",
    messagingSenderId: "1088927815489",
    appId: "1:1088927815489:web:61d745609fbf4c8b9e73c0"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

const App = {
    user: null,
    state: { faturamentos: [], despesas: [], retiradas: [] },

    init() {
        // Escuta o estado da autenticação (Login/Logout)
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.user = user;
                this.startDataListeners();
                // Mostra o app e esconde o login
                document.getElementById('auth-screen').style.display = 'none';
                document.getElementById('app-content').style.display = 'block';
            } else {
                this.user = null;
                // Mostra o login e esconde o app
                document.getElementById('auth-screen').style.display = 'flex';
                document.getElementById('app-content').style.display = 'none';
            }
        });

        // Configuração do Service Worker para o PWA funcionar offline
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => console.log("Service Worker registrado com sucesso!"))
                .catch(err => console.log("Erro ao registrar SW:", err));
        }

        // Prepara o seletor de meses na interface
        UI.renderMonthSelector();
    },

    // Inicia a escuta em tempo real do banco de dados para as 3 coleções
    startDataListeners() {
        const collections = ['faturamentos', 'despesas', 'retiradas'];
        collections.forEach(col => {
            Database.subscribe(col, this.user.uid, (docs) => {
                this.state[col] = docs;
                this.refreshUI(); // Sempre que o banco mudar, a tela atualiza sozinha
            });
        });
    },

    // A "Mágica" que calcula tudo e desenha na tela
    refreshUI() {
        const MEI_LIMIT = 81000;
        
        // 1. Saldo Real (Histórico de toda a vida da conta)
        const totalVendas = this.state.faturamentos.reduce((a, b) => a + (b.valor || 0), 0);
        const totalGastos = this.state.despesas.reduce((a, b) => a + (b.valor || 0), 0);
        const totalLucroDistribuido = this.state.retiradas.reduce((a, b) => a + (b.valor || 0), 0);
        
        const saldoCaixa = totalVendas - totalGastos - totalLucroDistribuido;
        document.getElementById('saldo-disponivel').innerText = UI.formatBRL(saldoCaixa);

        // 2. Filtro de Tempo (Baseado na seleção de Mês e Ano do usuário)
        const filterFn = (item) => {
            const d = new Date(item.data + "T00:00:00");
            const anoMatch = d.getFullYear() === UI.selectedYear;
            const mesMatch = (UI.selectedMonth === null || d.getMonth() === UI.selectedMonth);
            return anoMatch && mesMatch;
        };

        const fFiltered = this.state.faturamentos.filter(filterFn);
        const dFiltered = this.state.despesas.filter(filterFn);
        const rFiltered = this.state.retiradas.filter(filterFn);

        const tF = fFiltered.reduce((a, b) => a + (b.valor || 0), 0);
        const tD = dFiltered.reduce((a, b) => a + (b.valor || 0), 0);
        const tR = rFiltered.reduce((a, b) => a + (b.valor || 0), 0);

        // 3. Atualiza os cards de resumo do período selecionado
        document.getElementById('total-f').innerText = UI.formatBRL(tF);
        document.getElementById('total-d').innerText = UI.formatBRL(tD);
        document.getElementById('total-r').innerText = UI.formatBRL(tR);

        // 4. Lógica do Monitor MEI (Considera faturamento BRUTO do ano selecionado)
        const fAnualMEI = this.state.faturamentos
            .filter(i => new Date(i.data + "T00:00:00").getFullYear() === UI.selectedYear)
            .reduce((a, b) => a + (b.valor || 0), 0);
        
        const porcentagemMEI = Math.min((fAnualMEI / MEI_LIMIT) * 100, 100);
        document.getElementById('mei-total-val').innerText = UI.formatBRL(fAnualMEI);
        document.getElementById('mei-percent').innerText = `${porcentagemMEI.toFixed(1)}% do limite`;
        document.getElementById('mei-bar').style.width = `${porcentagemMEI}%`;

        // 5. Atualiza o Gráfico e as Listas
        UI.renderChart(tF, tD, tR);
        
        if (UI.activeTab !== 'resumo') {
            const dataMap = {
                'faturamentos': fFiltered,
                'despesas': dFiltered,
                'retiradas': rFiltered
            };
            UI.renderItemsList(dataMap[UI.activeTab]);
        }
    }
};

// Inicia a aplicação
App.init();
