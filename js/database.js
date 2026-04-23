/**
 * Módulo de Banco de Dados Vitrine Pro
 * Responsável pelas operações de CRUD no Firestore e Storage.
 */

const Database = {
    /**
     * Subscreve aos dados em tempo real filtrando pelo ID do utilizador.
     * @param {string} collection - Nome da coleção (faturamentos, despesas, retiradas)
     * @param {string} userId - ID do utilizador logado
     * @param {function} callback - Função a executar quando os dados mudarem
     */
    subscribe(collection, userId, callback) {
        if (!userId) return;

        // Ordena por data decrescente para mostrar os mais recentes primeiro
        return firebase.firestore().collection(collection)
            .where("userId", "==", userId)
            .orderBy('data', 'desc')
            .onSnapshot(snap => {
                const docs = snap.docs.map(doc => ({ 
                    id: doc.id, 
                    type: collection, 
                    ...doc.data() 
                }));
                callback(docs);
            }, error => {
                console.error(`Erro ao assinar ${collection}:`, error);
                // DICA: Se aparecer erro de índice no console, clique no link gerado pelo Firebase
            });
    },

    /**
     * Guarda ou Atualiza um registo, incluindo upload opcional de comprovativo.
     * @param {string} collection - Coleção de destino
     * @param {object} data - Dados do formulário
     * @param {string} userId - ID do utilizador
     * @param {Blob} blob - Imagem comprimida (opcional)
     */
    async saveItem(collection, data, userId, blob = null) {
        if (!userId) throw new Error("Utilizador não identificado.");

        let url = data.comprovanteUrl || "";

        // Se houver uma nova imagem, faz o upload para o Storage
        if (blob) {
            try {
                UI.showToast("A enviar comprovativo...");
                const fileName = `proof_${Date.now()}.jpg`;
                const ref = firebase.storage().ref().child(`comprovantes/${userId}/${fileName}`);
                const task = await ref.put(blob);
                url = await task.ref.getDownloadURL();
            } catch (storageError) {
                console.error("Erro no Storage:", storageError);
                UI.showToast("Erro ao guardar imagem. A salvar apenas dados.");
            }
        }

        const payload = {
            descricao: data.descricao,
            data: data.data,
            userId: userId,
            comprovanteUrl: url,
            valor: parseFloat(data.valor),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Verifica se é edição (tem ID) ou novo registo
        if (data.id && data.id.trim() !== "") {
            const id = data.id;
            return firebase.firestore().collection(collection).doc(id).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return firebase.firestore().collection(collection).add(payload);
        }
    },

    /**
     * Remove um registo do Firestore e o seu ficheiro do Storage.
     * @param {string} collection - Coleção de destino
     * @param {string} id - ID do documento
     * @param {string} imageUrl - URL da imagem para remover do Storage
     */
    async deleteItem(collection, id, imageUrl) {
        // Confirmação nativa (pode ser substituída por modal UI)
        if (!confirm("Tem a certeza que deseja eliminar este registo?")) return;

        try {
            // Remove a imagem do Storage se existir
            if (imageUrl && imageUrl.includes("firebasestorage")) {
                try {
                    await firebase.storage().refFromURL(imageUrl).delete();
                } catch (e) {
                    console.warn("Ficheiro de imagem não encontrado ou já removido.");
                }
            }
            
            // Remove o documento do Firestore
            await firebase.firestore().collection(collection).doc(id).delete();
            UI.showToast("Registo eliminado com sucesso!");
        } catch (error) {
            UI.showToast("Erro ao eliminar registo.");
            console.error(error);
        }
    }
};

/**
 * Listener do formulário de lançamento.
 * Intercepta o envio do formulário e utiliza o objeto Database para persistir.
 */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('entry-form');
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();
            
            const btn = document.getElementById('btn-save');
            const originalText = btn.innerText;
            
            // Evita submissões duplas
            btn.disabled = true;
            btn.innerText = "A GUARDAR...";

            const data = {
                id: document.getElementById('edit-id').value,
                descricao: document.getElementById('inp-desc').value,
                valor: document.getElementById('inp-valor').value,
                data: document.getElementById('inp-data').value,
            };

            try {
                // UI.activeModalType e UI.compressedBlob devem ser geridos pelo módulo ui.js
                const type = UI.activeModalType || 'faturamentos';
                const blob = UI.compressedBlob || null;

                await Database.saveItem(type, data, App.userId, blob);
                
                UI.showToast("Dados guardados!");
                UI.closeModal();
            } catch (error) {
                UI.showToast("Erro ao ligar ao servidor.");
                console.error(error);
            } finally {
                btn.disabled = false;
                btn.innerText = originalText;
            }
        };
    }
});

// Torna o Database disponível globalmente
window.Database = Database;
