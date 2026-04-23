/**
 * Módulo de Interface (UI) - Vitrine Pro
 * Responsável por gerir menus, abas, modais e renderização de componentes visuais.
 */

const UI = {
    chartInstance: null,
    activeTab: 'resumo',
    activeMonth: 'todos', // Define "Todos" como padrão inicial
    activeYear: new Date().getFullYear(),
    activeModalType: 'faturamentos',

    /**
     * Inicializa os componentes básicos da interface
     */
    init() {
        this.renderYearFilter();
        this.renderMonthSelector();
        console.log("Interface UI Inicializada.");
    },

    /**
     * Gera as opções do seletor de ano (Ano atual e anteriores)
     */
    renderYearFilter() {
        const select = document.getElementById('year-filter');
        if (!select) return;

        const currentYear = new Date().getFullYear();
        select.innerHTML = '';
        
        for (let i = currentYear; i >= currentYear - 2; i--) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            select.appendChild(opt);
        }
        select.value = this.activeYear;
    },

    /**
     * Gera os botões de meses, incluindo a opção "Todos"
     */
    renderMonthSelector() {
        const container = document.getElementById('month-selector');
        if (!container) return;

        const meses = [
            { id: 'todos', nome: 'Todos' },
            { id: '0', nome: 'Jan' }, { id: '1', nome: 'Fev' },
            { id: '2', nome: 'Mar' }, { id: '3', nome: 'Abr' },
            { id: '4', nome: 'Mai' }, { id: '5', nome: 'Jun' },
            { id: '6', nome: 'Jul' }, { id: '7', nome: 'Ago' },
            { id: '8', nome: 'Set' }, { id: '9', nome: 'Out' },
            { id: '10', nome: 'Nov' }, { id: '11', nome: 'Dez' }
        ];

        container.innerHTML = meses.map(m => {
            const isActive = this.activeMonth === m.id;
            return `
                <button onclick="UI.selectMonth('${m.id}')" 
                        id="month-${m.id}"
                        class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 border
                        ${isActive 
                            ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20 border-[#00ff88]' 
                            : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}">
                    ${m.nome}
                </button>
            `;
        }).join('');
    },

    /**
     * Altera o mês ativo e solicita atualização dos dados ao App
     */
    selectMonth(monthId) {
        this.activeMonth = monthId;
        this.renderMonthSelector();
        if (window.App && typeof window.App.refreshData === 'function') {
            window.App.refreshData();
        }
    },

    /**
     * Altera o ano ativo e solicita atualização
     */
    filterByYear(year) {
        this.activeYear = parseInt(year);
        if (window.App && typeof window.App.refreshData === 'function') {
            window.App.refreshData();
        }
    },

    /**
     * Alterna entre as abas principais
     */
    switchTab(tab) {
        this.activeTab = tab;
        
        // Atualiza estilo dos botões da navbar
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-tab-${tab}`);
        if (activeBtn) activeBtn.classList.add('active');

        const sectionResumo = document.getElementById('section-resumo');
        const sectionListagem = document.getElementById('section-listagem');

        if (tab === 'resumo') {
            if (sectionResumo) sectionResumo.classList.remove('hidden');
            if (sectionListagem) sectionListagem.classList.add('hidden');
        } else {
            if (sectionResumo) sectionResumo.classList.add('hidden');
            if (sectionListagem) sectionListagem.classList.remove('hidden');
            this.activeModalType = tab; 
        }

        if (window.App && typeof window.App.refreshData === 'function') {
            window.App.refreshData();
        }
    },

    /**
     * Renderiza a lista de itens para as abas de Vendas, Custos ou Lucros
     */
    renderList(items) {
        const container = document.getElementById('items-list');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="p-10 text-center space-y-4">
                    <i class="ph ph-folder-open text-4xl text-slate-700"></i>
                    <p class="text-xs text-slate-500 font-bold uppercase tracking-widest">Nenhum registo encontrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            const date = new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR');
            const valor = Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            return `
                <div class="glass p-5 rounded-2xl flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2 duration-300 mb-3">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <i class="ph-bold ${this.getIconForType(item.type)} text-lg text-slate-400"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-white uppercase">${item.descricao}</h4>
                            <p class="text-[9px] text-slate-500 font-bold uppercase">${date}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-xs font-black ${this.getColorForType(item.type)}">${valor}</p>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="UI.editItem('${item.type}', '${item.id}')" class="p-2 text-slate-500 hover:text-[#00ff88] transition-colors"><i class="ph ph-pencil-simple"></i></button>
                            <button onclick="Database.deleteItem('${item.type}', '${item.id}')" class="p-2 text-slate-500 hover:text-red-500 transition-colors"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getIconForType(type) {
        const icons = { faturamentos: 'ph-trend-up', despesas: 'ph-trend-down', retiradas: 'ph-wallet' };
        return icons[type] || 'ph-dots-three';
    },

    getColorForType(type) {
        const colors = { faturamentos: 'text-[#00ff88]', despesas: 'text-red-500', retiradas: 'text-purple-400' };
        return colors[type] || 'text-white';
    },

    /**
     * Atualiza o gráfico de Doughnut
     */
    updateChart(f, d, r) {
        const ctx = document.getElementById('chartResumo');
        if (!ctx) return;

        const data = {
            labels: ['Vendas', 'Custos', 'Lucros'],
            datasets: [{
                data: [f, d, r],
                backgroundColor: ['#00ff88', '#ef4444', '#a855f7'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        };

        if (this.chartInstance) {
            this.chartInstance.data = data;
            this.chartInstance.update();
        } else {
            this.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '75%',
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#94a3b8', font: { size: 10, weight: 'bold' }, padding: 20 }
                        }
                    }
                }
            });
        }
    },

    /**
     * Gestão de Modais
     */
    openModal(editData = null) {
        const modal = document.getElementById('modal-entry');
        const form = document.getElementById('entry-form');
        if (!modal || !form) return;

        form.reset();
        document.getElementById('edit-id').value = '';

        if (editData) {
            document.getElementById('modal-title').innerText = "Editar Registo";
            document.getElementById('edit-id').value = editData.id;
            document.getElementById('inp-desc').value = editData.descricao;
            document.getElementById('inp-valor').value = editData.valor;
            document.getElementById('inp-data').value = editData.data;
            this.setEntryType(editData.type);
        } else {
            document.getElementById('modal-title').innerText = "Novo Lançamento";
            const typeToSet = (this.activeTab !== 'resumo') ? this.activeTab : 'faturamentos';
            this.setEntryType(typeToSet);
            document.getElementById('inp-data').valueAsDate = new Date();
        }

        modal.classList.remove('hidden');
    },

    closeModal() {
        const modal = document.getElementById('modal-entry');
        if (modal) modal.classList.add('hidden');
    },

    setEntryType(type) {
        this.activeModalType = type;
        const btns = {
            faturamentos: document.getElementById('btn-type-f'),
            despesas: document.getElementById('btn-type-d'),
            retiradas: document.getElementById('btn-type-r')
        };

        Object.values(btns).forEach(b => {
            if (b) b.className = "flex-1 py-3 rounded-xl text-[9px] font-black transition-all text-slate-500 bg-white/5";
        });

        const activeColors = {
            faturamentos: "bg-[#00ff88] text-black border border-[#00ff88]/50 shadow-lg shadow-[#00ff88]/10",
            despesas: "bg-red-500 text-white border border-red-500/50 shadow-lg shadow-red-500/10",
            retiradas: "bg-purple-500 text-white border border-purple-500/50 shadow-lg shadow-purple-500/10"
        };

        if (btns[type]) {
            btns[type].className = `flex-1 py-3 rounded-xl text-[9px] font-black transition-all ${activeColors[type]}`;
        }
    },

    editItem(type, id) {
        if (window.App && window.App.data && window.App.data[type]) {
            const item = window.App.data[type].find(i => i.id === id);
            if (item) this.openModal({ ...item, type });
        }
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        if (!t) return;
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 3000);
    }
};

window.UI = UI;

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
