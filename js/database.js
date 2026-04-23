const Database = {
    // Escuta os dados em tempo real filtrando por usuário
    subscribe(collection, userId, callback) {
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
            });
    },

    // Salva ou Atualiza um registro
    async saveItem(collection, data, userId, blob = null) {
        let url = data.comprovanteUrl || "";

        // Se houver uma nova imagem (blob), faz o upload
        if (blob) {
            UI.showToast("Subindo comprovante...");
            const ref = firebase.storage().ref().child(`comprovantes/${userId}/${Date.now()}.jpg`);
            const task = await ref.put(blob);
            url = await task.ref.getDownloadURL();
        }

        const payload = {
            ...data,
            userId,
            comprovanteUrl: url,
            valor: parseFloat(data.valor),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (data.id) {
            const id = data.id;
            delete payload.id;
            return firebase.firestore().collection(collection).doc(id).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            return firebase.firestore().collection(collection).add(payload);
        }
    },

    // Deleta um registro e sua imagem se existir
    async deleteItem(collection, id, imageUrl) {
        if (!confirm("Tem certeza que deseja excluir?")) return;

        try {
            if (imageUrl && imageUrl.includes("firebase")) {
                try {
                    await firebase.storage().refFromURL(imageUrl).delete();
                } catch (e) {
                    console.warn("Imagem não encontrada no storage ou já removida.");
                }
            }
            await firebase.firestore().collection(collection).doc(id).delete();
            UI.showToast("Excluído com sucesso!");
        } catch (error) {
            UI.showToast("Erro ao excluir.");
            console.error(error);
        }
    }
};

// Listener do formulário (conecta a UI ao Database)
document.getElementById('entry-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.innerText = "SALVANDO...";

    const data = {
        id: document.getElementById('edit-id').value,
        descricao: document.getElementById('inp-desc').value,
        valor: document.getElementById('inp-valor').value,
        data: document.getElementById('inp-data').value,
    };

    try {
        await Database.saveItem(UI.activeModalType, data, App.user.uid, UI.compressedBlob);
        UI.showToast("Salvo com sucesso!");
        UI.closeModal();
    } catch (error) {
        UI.showToast("Erro ao salvar.");
        console.error(error);
    } finally {
        btn.disabled = false;
        btn.innerText = "SALVAR LANÇAMENTO";
    }
};
