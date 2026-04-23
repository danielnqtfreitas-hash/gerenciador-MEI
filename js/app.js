const firebaseConfig = { /* Sua Config */ };
firebase.initializeApp(firebaseConfig);

const App = {
    user: null,
    state: { faturamentos: [], despesas: [], retiradas: [] },

    init() {
        // Monitora Login
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                this.user = user;
                this.loadData();
                UI.toggleView('app');
            } else {
                UI.toggleView('login');
            }
        });

        // Registrar PWA Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    },

    loadData() {
        const collections = ['faturamentos', 'despesas', 'retiradas'];
        collections.forEach(col => {
            Database.subscribe(col, this.user.uid, (data) => {
                this.state[col] = data;
                UI.renderAll(this.state); // Atualiza a tela
            });
        });
    }
};

App.init();
