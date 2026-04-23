/**
 * Módulo de Autenticação - Vitrine Pro
 * Gerencia login, logout e persistência de sessão via Firebase Auth.
 */

const Auth = {
    // Referência para o estado de carregamento do botão
    isSubmitting: false,

    /**
     * Realiza o login com E-mail e Senha
     */
    async login(email, pass) {
        if (this.isSubmitting) return;
        
        if (!email || !pass) {
            UI.showToast("Preencha todos os campos de acesso");
            return;
        }

        const btn = document.getElementById('btn-login');
        const originalText = btn.innerText;

        try {
            this.setLoading(true, btn);
            
            // Define a persistência como LOCAL (mantém logado mesmo fechando o browser)
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Autenticação com Firebase
            await firebase.auth().signInWithEmailAndPassword(email, pass);
            
            UI.showToast("Acesso autorizado!");
        } catch (error) {
            console.error("Erro na autenticação:", error);
            let message = "Falha ao aceder à plataforma";
            
            switch (error.code) {
                case 'auth/invalid-email':
                    message = "E-mail com formato inválido";
                    break;
                case 'auth/user-not-found':
                    message = "Utilizador não cadastrado";
                    break;
                case 'auth/wrong-password':
                    message = "Senha incorreta";
                    break;
                case 'auth/too-many-requests':
                    message = "Muitas tentativas. Tente mais tarde";
                    break;
            }
            
            UI.showToast(message);
        } finally {
            this.setLoading(false, btn, originalText);
        }
    },

    /**
     * Encerra a sessão do utilizador
     */
    async logout() {
        try {
            await firebase.auth().signOut();
            window.location.reload(); // Recarrega para limpar estados da memória
        } catch (error) {
            UI.showToast("Erro ao sair da conta");
        }
    },

    /**
     * Controla o estado visual de carregamento
     */
    setLoading(loading, btn, text = "") {
        this.isSubmitting = loading;
        if (loading) {
            btn.disabled = true;
            btn.innerHTML = `<i class="ph ph-circle-notch animate-spin"></i> AUTENTICANDO...`;
            btn.style.opacity = "0.7";
        } else {
            btn.disabled = false;
            btn.innerText = text;
            btn.style.opacity = "1";
        }
    },

    /**
     * Monitoriza o estado da autenticação em tempo real
     */
    initAuthListener() {
        const authScreen = document.getElementById('auth-screen');
        const appContent = document.getElementById('app-content');

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Utilizador Logado
                authScreen.style.display = 'none';
                appContent.style.display = 'block';
                
                // Inicia o carregamento dos dados do utilizador
                if (typeof App !== 'undefined' && App.init) {
                    App.init(user.uid);
                }
            } else {
                // Utilizador Deslogado
                authScreen.style.display = 'flex';
                appContent.style.display = 'none';
            }
        });
    }
};

// Inicialização dos eventos quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Inicia o listener de estado
    Auth.initAuthListener();

    // Evento do botão de login
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-pass').value;
            Auth.login(email, pass);
        });
    }

    // Suporte para tecla "Enter" nos inputs
    const authInputs = document.querySelectorAll('#auth-screen input');
    authInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });
    });
});
