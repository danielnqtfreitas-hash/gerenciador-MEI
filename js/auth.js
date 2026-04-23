const Auth = {
    // Configura o provedor de autenticação do Google
    googleProvider: new firebase.auth.GoogleAuthProvider(),

    async login() {
        try {
            // Define a persistência como LOCAL (mantém logado mesmo fechando a aba ou o navegador)
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Inicia o processo de login via Popup
            const result = await firebase.auth().signInWithPopup(this.googleProvider);
            
            const user = result.user;
            UI.showToast(`Olá, ${user.displayName.split(' ')[0]}!`);
            
        } catch (error) {
            console.error("Erro no login Google:", error);
            
            // Tratamento de erro específico para popups bloqueados
            if (error.code === 'auth/popup-blocked') {
                UI.showToast("Ligue os pop-ups para logar");
            } else {
                UI.showToast("Falha na conexão com Google");
            }
        }
    },

    async logout() {
        try {
            await firebase.auth().signOut();
            UI.showToast("Sessão encerrada");
        } catch (error) {
            console.error("Erro ao sair:", error);
        }
    }
};

// Vincula o clique do botão de login (ID definido no index.html)
document.getElementById('btn-login').onclick = () => Auth.login();
