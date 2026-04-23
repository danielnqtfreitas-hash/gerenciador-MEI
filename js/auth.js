const firebaseConfig = {
    apiKey: "AIzaSyC-Wf9_C6rXo-8m9Q8m9Q8m9Q8m9Q8m9Q", 
    authDomain: "vitrine-913c6.firebaseapp.com",
    projectId: "vitrine-913c6",
    storageBucket: "vitrine-913c6.firebasestorage.app",
    messagingSenderId: "1088927815489",
    appId: "1:1088927815489:web:61d745609fbf4c8b9e73c0"
};

firebase.initializeApp(firebaseConfig);

// --- LISTA DE E-MAILS LIBERADOS (Seus Clientes) ---
const CLIENTES_AUTORIZADOS = [
    "seu-email@gmail.com",
    "cliente1@gmail.com",
    "amigo-que-pagou@gmail.com"
];

const App = {
    user: null,
    state: { faturamentos: [], despesas: [], retiradas: [] },

    init() {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                // VERIFICAÇÃO DE ACESSO COMERCIAL
                if (CLIENTES_AUTORIZADOS.includes(user.email)) {
                    this.user = user;
                    this.startDataListeners();
                    document.getElementById('auth-screen').style.display = 'none';
                    document.getElementById('app-content').style.display = 'block';
                } else {
                    // SE NÃO ESTIVER NA LISTA, DESLOGA NA HORA
                    UI.showToast("Acesso não autorizado. Contate o administrador.");
                    await firebase.auth().signOut();
                }
            } else {
                this.user = null;
                document.getElementById('auth-screen').style.display = 'flex';
                document.getElementById('app-content').style.display = 'none';
            }
        });

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch(err => console.log(err));
        }

        UI.renderMonthSelector();
    },

    startDataListeners() {
        const collections = ['faturamentos', 'despesas', 'retiradas'];
        collections.forEach(col => {
            Database.subscribe(col, this.user.uid, (docs) => {
                this.state[col] = docs;
                this.refreshUI();
            });
        });
    },

    refreshUI() {
        const MEI_LIMIT = 81000;
        
        const totalVendas = this.state.faturamentos.reduce((a, b) => a + (b.valor || 0), 0);
        const totalGastos = this.state.despesas.reduce((a, b) => a + (b.valor || 0), 0);
        const totalLucro = this.state.retiradas.reduce((a, b) => a + (b.valor || 0), 0);
        
        document.getElementById('saldo-disponivel').innerText = UI.formatBRL(totalVendas - totalGastos - totalLucro);

        const filterFn = (item) => {
            const d = new Date(item.data + "T00:00:00");
            return d.getFullYear() === UI.selectedYear && (UI.selectedMonth === null || d.getMonth() === UI.selectedMonth);
        };

        const fFiltered = this.state.faturamentos.filter(filterFn);
        const dFiltered = this.state.despesas.filter(filterFn);
        const rFiltered = this.state.retiradas.filter(filterFn);

        document.getElementById('total-f').innerText = UI.formatBRL(fFiltered.reduce((a, b) => a + (b.valor || 0), 0));
        document.getElementById('total-d').innerText = UI.formatBRL(dFiltered.reduce((a, b) => a + (b.valor || 0), 0));
        document.getElementById('total-r').innerText = UI.formatBRL(rFiltered.reduce((a, b) => a + (b.valor || 0), 0));

        const fAnualMEI = this.state.faturamentos
            .filter(i => new Date(i.data + "T00:00:00").getFullYear() === UI.selectedYear)
            .reduce((a, b) => a + (b.valor || 0), 0);
        
        const perc = Math.min((fAnualMEI / MEI_LIMIT) * 100, 100);
        document.getElementById('mei-total-val').innerText = UI.formatBRL(fAnualMEI);
        document.getElementById('mei-percent').innerText = `${perc.toFixed(1)}% do limite`;
        document.getElementById('mei-bar').style.width = `${perc}%`;

        UI.renderChart(
            fFiltered.reduce((a, b) => a + (b.valor || 0), 0),
            dFiltered.reduce((a, b) => a + (b.valor || 0), 0),
            rFiltered.reduce((a, b) => a + (b.valor || 0), 0)
        );
        
        if (UI.activeTab !== 'resumo') {
            const dataMap = { 'faturamentos': fFiltered, 'despesas': dFiltered, 'retiradas': rFiltered };
            UI.renderItemsList(dataMap[UI.activeTab]);
        }
    }
};

App.init();
