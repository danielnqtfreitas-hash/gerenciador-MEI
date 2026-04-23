
const Auth = {
    async login(email, pass) {
        try {
            await firebase.auth().signInWithEmailAndPassword(email, pass);
        } catch (error) {
            UI.showToast("Erro: " + error.message);
        }
    },

    async signup(email, pass) {
        try {
            await firebase.auth().createUserWithEmailAndPassword(email, pass);
        } catch (error) {
            UI.showToast("Erro ao criar conta.");
        }
    },

    logout() {
        firebase.auth().signOut();
    }
};

// Vincula os botões da tela de login
document.getElementById('btn-login').onclick = () => {
    const e = document.getElementById('login-email').value;
    const p = document.getElementById('login-pass').value;
    Auth.login(e, p);
};
