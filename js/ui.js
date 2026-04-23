const UI = {
    activeTab: 'resumo',
    selectedMonth: null,
    selectedYear: new Date().getFullYear(),
    activeModalType: 'faturamentos',
    chartObj: null,
    compressedBlob: null,

    // Alternar entre abas (Resumo, Vendas, Gastos, Lucro)
    switchTab(tab) {
        this.activeTab = tab;
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-tab-${tab}`).classList.add('active');
        
        document.getElementById('section-resumo').classList.toggle('hidden', tab !== 'resumo');
        document.getElementById('section-listagem').classList.toggle('hidden', tab === 'resumo');
        
        App.refreshUI();
    },

    // Renderizar o seletor de meses
    renderMonthSelector() {
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const container = document.getElementById('month-selector');
        
        let html = `<div class="month-pill ${this.selectedMonth === null ? 'active' : ''}" onclick="UI.filterByMonth(null)">Todos</div>`;
        
        html += meses.map((m, i) => `
            <div class="month-pill ${this.selectedMonth === i ? 'active' : ''}" onclick="UI.filterByMonth(${i})">
                ${m}
            </div>
        `).join('');
        
        container.innerHTML = html;
    },

    filterByMonth(m) { 
        this.selectedMonth = m; 
        this.renderMonthSelector(); 
        App.refreshUI(); 
    },

    filterByYear(y) { 
        this.selectedYear = parseInt(y); 
        App.refreshUI(); 
    },

    // Formatação de Moeda
    formatBRL(v) { 
        return v.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }); 
    },

    // Exibir notificações (Toast)
    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 2500);
    },

    // Renderizar Gráfico
    renderChart(f, d, r) {
        const ctx = document.getElementById('chartResumo').getContext('2d');
        if(this.chartObj) this.chartObj.destroy();
        
        this.chartObj = new Chart(ctx, {
            type: 'doughnut',
            data: { 
                labels: ['Vendas', 'Gastos', 'Lucro'], 
                datasets: [{ 
                    data: [f, d, r], 
                    backgroundColor: ['#00ff88', '#ef4444', '#a855f7'], 
                    borderWidth: 0, 
                    cutout: '80%',
                    borderRadius: 10
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        display: true, 
                        position: 'bottom', 
                        labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10, weight: 'bold' } } 
                    } 
                } 
            }
        });
    },

    // Renderizar Lista de Itens (Vendas/Gastos/Lucro)
    renderItemsList(data) {
        const list = document.getElementById('items-list');
        list.innerHTML = data.length === 0 ? 
            `<div class="py-20 text-center opacity-20 text-[10px] font-black italic">Vazio no período</div>` : '';
        
        data.forEach(item => {
            let color = 'text-green-400', icon = 'ph-arrow-up-right';
            if(item.type === 'despesas') { color = 'text-red-400'; icon = 'ph-arrow-down-left'; }
            if(item.type === 'retiradas') { color = 'text-purple-400'; icon = 'ph-hand-coins'; }

            const div = document.createElement('div');
            div.className = `card p-4 mb-3 flex items-center justify-between border-slate-800/40 active:scale-[0.98] transition-all`;
            
            div.onclick = (e) => {
                if(e.target.closest('button')) return;
                item.comprovanteUrl ? this.openViewer(item) : this.openEditModal(item);
            };

            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 ${color} shadow-lg shadow-black/20">
                        <i class="ph-bold ${icon} text-lg"></i>
                    </div>
                    <div>
                        <h4 class="text-[12px] font-bold text-white mb-0.5">${item.descricao}</h4>
                        <p class="text-[8px] text-slate-500 font-bold uppercase">${item.data.split('-').reverse().join('/')}</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-sm font-black mr-3 ${color}">${this.formatBRL(item.valor)}</span>
                    ${item.comprovanteUrl ? `<i class="ph-bold ph-paperclip text-[#00ff88] mr-3"></i>` : ''}
                    <button onclick="event.stopPropagation(); Database.deleteItem('${item.type}','${item.id}','${item.comprovanteUrl}')" class="p-2 text-slate-700 hover:text-red-500">
                        <i class="ph-bold ph-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
    },

    // Modais e Imagens
    openModal() { document.getElementById('modal-entry').classList.remove('hidden'); },
    
    closeModal() { 
        document.getElementById('modal-entry').classList.add('hidden'); 
        document.getElementById('entry-form').reset();
        document.getElementById('edit-id').value = "";
        document.getElementById('preview-img').style.display = 'none';
        this.compressedBlob = null;
    },

    openViewer(item) {
        document.getElementById('view-full-img').src = item.comprovanteUrl;
        document.getElementById('image-viewer').classList.remove('hidden');
    },

    closeViewer() { document.getElementById('image-viewer').classList.add('hidden'); },

    setEntryType(t) {
        this.activeModalType = t;
        const map = {faturamentos: 'f', despesas: 'd', retiradas: 'r'};
        ['f', 'd', 'r'].forEach(k => {
            const btn = document.getElementById(`btn-type-${k}`);
            btn.className = `flex-1 py-2 rounded-lg text-[9px] font-black transition-all ${map[t] === k ? 'bg-[#00ff88] text-black' : 'text-slate-400 bg-slate-900/50'}`;
        });
    },

    processImage(input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 1000;
                let w = img.width, h = img.height;
                if(w > MAX) { h *= MAX/w; w = MAX; }
                canvas.width = w; canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                document.getElementById('preview-img').src = canvas.toDataURL('image/jpeg', 0.8);
                document.getElementById('preview-img').style.display = 'block';
                canvas.toBlob(b => this.compressedBlob = b, 'image/jpeg', 0.8);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    exportData() {
        const s = document.getElementById('saldo-disponivel').innerText;
        const texto = `📊 *RESUMO FINANCEIRO*\n💰 Saldo em Caixa: ${s}\n\n_Gerado por Vitrine Pro_`;
        if (navigator.share) {
            navigator.share({ title: 'Resumo Financeiro', text: texto });
        } else {
            navigator.clipboard.writeText(texto);
            this.showToast("Copiado para área de transferência!");
        }
    }
};
