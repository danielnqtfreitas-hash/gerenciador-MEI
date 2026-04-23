/**
 * Módulo de Autenticação Vitrine Pro
 * Responsável pelo login, logout e monitorização do estado da sessão.
 */

const Auth = {
    isSubmitting: false,

    /**
     * Realiza o login do utilizador
     * @param {string} email 
     * @param {string} pass 
     */
    async login(email, pass) {
        if (this.isSubmitting) return;

        const emailClean = email.trim();
        const passClean = pass.trim();

        if (!emailClean || !passClean) {
            UI.showToast("Preencha todos os campos corretamente.");
            return;
        }

        const btn = document.getElementById('btn-login');
        const originalText = btn.innerHTML;

        try {
            this.setLoading(true, btn);

            // Configura a persistência para LOCAL (mantém a sessão mesmo fechando o navegador)
            await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            
            // Tenta realizar o login
            await firebase.auth().signInWithEmailAndPassword(emailClean, passClean);
            
            UI.showToast("Acesso autorizado!");
        } catch (error) {
            console.error("Erro de Autenticação:", error);
            let msg = "Falha ao aceder à plataforma.";

            // Tratamento de erros específicos do Firebase
            switch (error.code) {
                case 'auth/invalid-email':
                    msg = "O formato do e-mail é inválido.";
                    break;
                case 'auth/user-disabled':
                    msg = "Este utilizador foi desativado.";
                    break;
                case 'auth/user-not-found':
                    msg = "Utilizador não cadastrado.";
                    break;
                case 'auth/wrong-password':
                    msg = "Palavra-passe incorreta.";
                    break;
                case 'auth/invalid-credential':
                    msg = "Credenciais inválidas. Verifique os dados.";
                    break;
                case 'auth/too-many-requests':
                    msg = "Muitas tentativas falhadas. Tente mais tarde.";
                    break;
            }
            UI.showToast(msg);
        } finally {
            this.setLoading(false, btn, originalText);
        }
    },

    /**
     * Finaliza a sessão do utilizador
     */
    async logout() {
        try {
            await firebase.auth().signOut();
            UI.showToast("Sessão terminada.");
            // O listener onAuthStateChanged cuidará de mostrar a tela de login
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
            UI.showToast("Erro ao encerrar sessão.");
        }
    },

    /**
     * Controla o estado visual do botão durante o carregamento
     */
    setLoading(loading, btn, originalText) {
        this.isSubmitting = loading;
        btn.disabled = loading;
        if (loading) {
            btn.innerHTML = `<i class="ph ph-circle-notch animate-spin text-xl"></i>`;
            btn.classList.add('opacity-80', 'cursor-not-allowed');
        } else {
            btn.innerHTML = originalText;
            btn.classList.remove('opacity-80', 'cursor-not-allowed');
        }
    },

    /**
     * Monitoriza se o utilizador está logado ou não
     */
    initAuthListener() {
        const authScreen = document.getElementById('auth-screen');
        const appContent = document.getElementById('app-content');

        if (!firebase || !firebase.auth) {
            console.error("SDK do Firebase não detetado.");
            return;
        }

        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // Utilizador logado
                console.log("Sessão ativa:", user.email);
                authScreen.style.display = 'none';
                appContent.style.display = 'block';
                
                // Inicializa a lógica da aplicação principal
                if (typeof App !== 'undefined' && App.init) {
                    App.init(user.uid);
                }
            } else {
                // Sem utilizador
                authScreen.style.display = 'flex';
                appContent.style.display = 'none';
                
                // Limpa campos de login ao deslogar
                document.getElementById('login-email').value = '';
                document.getElementById('login-pass').value = '';
            }
        });
    }
};

/**
 * Inicialização dos eventos ao carregar o DOM
 */
document.addEventListener('DOMContentLoaded', () => {
    // Inicia a escuta da sessão
    Auth.initAuthListener();

    // Evento de clique no botão de login
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) {
        btnLogin.addEventListener('click', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            Auth.login(email, pass);
        });
    }

    // Atalho: Login ao pressionar "Enter" no campo de senha
    const passInput = document.getElementById('login-pass');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const email = document.getElementById('login-email').value;
                const pass = passInput.value;
                Auth.login(email, pass);
            }
        });
    }
});
