/**
 * Módulo de Base de Dados (Firestore)
 * Organizado para gravar dados vinculados ao ID único do utilizador.
 */

const Database = {
    /**
     * Subscreve aos dados.
     * Para garantir performance e evitar erros de índice, 
     * filtramos os dados do utilizador logado em tempo real.
     */
    subscribe(collectionName, userId, callback) {
        if (!userId) return;

        // Acessamos a coleção global (ex: faturamentos)
        return firebase.firestore().collection(collectionName)
            .where("userId", "==", userId) // Filtro de segurança
            .onSnapshot(snapshot => {
                const data = snapshot.docs
                    .map(doc => ({ id: doc.id, type: collectionName, ...doc.data() }))
                    .sort((a, b) => new Date(b.data) - new Date(a.data));

                callback(data);
            }, error => {
                console.error(`Erro ao ler ${collectionName}:`, error);
            });
    },

    /**
     * Grava os dados no Firestore.
     * Garante que cada registo tenha o selo do utilizador (userId).
     */
    async saveItem(collectionName, data, userId) {
        if (!userId) {
            UI.showToast("Erro: Utilizador não autenticado.");
            return false;
        }

        try {
            // Preparar o objeto para gravação
            const payload = {
                descricao: data.descricao,
                valor: parseFloat(data.valor) || 0,
                data: data.data,
                userId: userId, // Isto vincula o dado à "pasta" do utilizador
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (data.id && data.id.trim() !== "") {
                // Atualizar existente
                await firebase.firestore().collection(collectionName).doc(data.id).update(payload);
                UI.showToast("Registo atualizado!");
            } else {
                // Criar novo
                payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                await firebase.firestore().collection(collectionName).add(payload);
                UI.showToast("Registo guardado com sucesso!");
            }
            
            return true;
        } catch (error) {
            console.error("Erro ao salvar no Firestore:", error);
            UI.showToast("Erro ao gravar no banco de dados.");
            return false;
        }
    },

    /**
     * Elimina um registo
     */
    async deleteItem(collectionName, id) {
        if (!confirm("Confirmar exclusão?")) return;

        try {
            await firebase.firestore().collection(collectionName).doc(id).delete();
            UI.showToast("Eliminado com sucesso.");
        } catch (error) {
            UI.showToast("Erro ao eliminar.");
        }
    }
};

/**
 * Listener do Formulário
 * Captura o evento de submit e envia para o Database.saveItem
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('entry-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btn-save');
            const originalText = btn.innerHTML;
            
            // Dados do formulário
            const itemData = {
                id: document.getElementById('edit-id').value,
                descricao: document.getElementById('inp-desc').value,
                valor: document.getElementById('inp-valor').value,
                data: document.getElementById('inp-data').value
            };

            // Tipo de coleção (faturamentos, despesas, retiradas)
            const collectionType = UI.activeModalType || 'faturamentos';
            
            // ID do utilizador logado (vem do App.userId ou firebase.auth())
            const currentUserId = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;

            if (!currentUserId) {
                UI.showToast("Sessão expirada. Faça login novamente.");
                return;
            }

            btn.disabled = true;
            btn.innerHTML = "<i class='ph ph-circle-notch animate-spin'></i> A GUARDAR...";

            const success = await Database.saveItem(collectionType, itemData, currentUserId);

            if (success) {
                UI.closeModal();
                // O onSnapshot cuidará de atualizar a lista automaticamente
            }

            btn.disabled = false;
            btn.innerHTML = originalText;
        };
    }
});

window.Database = Database;
