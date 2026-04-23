/**
 * Módulo de Interface (UI) Vitrine Pro
 * Gere a visualização, gráficos, modais e compressão de imagens.
 */

const UI = {
    chart: null,
    activeModalType: 'faturamentos',
    compressedBlob: null,

    /**
     * Alterna entre as abas principais (Resumo, Vendas, Custos, Lucros)
     */
    switchTab(tab) {
        App.currentTab = tab;
        
        // Atualiza botões da navegação
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-tab-${tab}`);
        if (activeBtn) activeBtn.classList.add('active');

        // Alterna visibilidade das secções
        const sectionResumo = document.getElementById('section-resumo');
        const sectionListagem = document.getElementById('section-listagem');

        if (tab === 'resumo') {
            sectionResumo.classList.remove('hidden');
            sectionListagem.classList.add('hidden');
        } else {
            sectionResumo.classList.add('hidden');
            sectionListagem.classList.remove('hidden');
        }

        App.refreshUI();
    },

    /**
     * Inicializa os seletores de mês e ano
     */
    initDateFilters() {
        const monthContainer = document.getElementById('month-selector');
        const yearSelect = document.getElementById('year-filter');
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Renderiza meses
        monthContainer.innerHTML = months.map((m, i) => `
            <button onclick="App.setMonth(${i})" 
                    class="month-pill px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border 
                    ${App.currentMonth === i ? 'bg-[#00ff88] text-black border-[#00ff88]' : 'bg-white/5 text-slate-500 border-white/5'}">
                ${m}
            </button>
        `).join('');

        // Renderiza anos (atual e anterior)
        const currentYear = new Date().getFullYear();
        yearSelect.innerHTML = `
            <option value="${currentYear}">${currentYear}</option>
            <option value="${currentYear - 1}">${currentYear - 1}</option>
        `;
        yearSelect.value = App.currentYear;
    },

    /**
     * Atualiza o visual do seletor de meses
     */
    updateMonthSelector(activeIdx) {
        const buttons = document.querySelectorAll('.month-pill');
        buttons.forEach((btn, i) => {
            if (i === activeIdx) {
                btn.classList.add('bg-[#00ff88]', 'text-black', 'border-[#00ff88]');
                btn.classList.remove('bg-white/5', 'text-slate-500', 'border-white/5');
            } else {
                btn.classList.remove('bg-[#00ff88]', 'text-black', 'border-[#00ff88]');
                btn.classList.add('bg-white/5', 'text-slate-500', 'border-white/5');
            }
        });
    },

    /**
     * Atualiza ou cria o gráfico de fluxo de caixa
     */
    updateChart(data) {
        const ctx = document.getElementById('chartResumo');
        if (!ctx) return;

        if (this.chart) {
            this.chart.data = data;
            this.chart.update();
        } else {
            this.chart = new Chart(ctx, {
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
     * Renderiza a lista de itens (Vendas, Despesas ou Retiradas)
     */
    renderList(items, type) {
        const container = document.getElementById('items-list');
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
            const date = new Date(item.data).toLocaleDateString('pt-PT');
            const valor = Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            
            return `
                <div class="glass p-5 rounded-2xl flex justify-between items-center group animate-in fade-in slide-in-from-bottom-2">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
                            <i class="ph-bold ${this.getIconForType(type)} text-lg text-slate-400"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-white uppercase">${item.descricao}</h4>
                            <p class="text-[9px] text-slate-500 font-bold uppercase">${date}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right">
                            <p class="text-xs font-black ${this.getColorForType(type)}">R$ ${valor}</p>
                            ${item.comprovanteUrl ? `<button onclick="window.open('${item.comprovanteUrl}')" class="text-[8px] font-black text-blue-400 uppercase tracking-tighter">Ver Anexo</button>` : ''}
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="UI.editItem('${type}', '${item.id}')" class="p-2 text-slate-400 hover:text-[#00ff88]"><i class="ph ph-pencil-simple"></i></button>
                            <button onclick="Database.deleteItem('${type}', '${item.id}', '${item.comprovanteUrl || ''}')" class="p-2 text-slate-400 hover:text-red-500"><i class="ph ph-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getIconForType(type) {
        const icons = { faturamentos: 'ph-receipt', despesas: 'ph-shopping-cart', retiradas: 'ph-hand-coins' };
        return icons[type] || 'ph-dots-three';
    },

    getColorForType(type) {
        const colors = { faturamentos: 'text-[#00ff88]', despesas: 'text-red-500', retiradas: 'text-purple-400' };
        return colors[type] || 'text-white';
    },

    /**
     * Animação suave para números nos cards
     */
    animateValue(id, value) {
        const el = document.getElementById(id);
        if (!el) return;
        const formatted = `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        el.innerText = formatted;
    },

    /**
     * Gestão de Modais
     */
    openModal(editData = null) {
        const modal = document.getElementById('modal-entry');
        const form = document.getElementById('entry-form');
        form.reset();
        document.getElementById('edit-id').value = '';
        this.compressedBlob = null;

        if (editData) {
            document.getElementById('modal-title').innerText = "Editar Registo";
            document.getElementById('edit-id').value = editData.id;
            document.getElementById('inp-desc').value = editData.descricao;
            document.getElementById('inp-valor').value = editData.valor;
            document.getElementById('inp-data').value = editData.data;
            this.setEntryType(editData.type);
        } else {
            document.getElementById('modal-title').innerText = "Lançar Operação";
            const currentTabType = App.currentTab === 'resumo' ? 'faturamentos' : App.currentTab;
            this.setEntryType(currentTabType);
            document.getElementById('inp-data').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-entry').classList.add('hidden');
    },

    setEntryType(type) {
        this.activeModalType = type;
        const btns = { f: 'btn-type-f', d: 'btn-type-d', r: 'btn-type-r' };
        Object.values(btns).forEach(id => {
            const b = document.getElementById(id);
            b.classList.remove('bg-[#00ff88]', 'text-black', 'bg-white/5', 'text-slate-500');
        });

        const activeId = btns[type.charAt(0)];
        const activeBtn = document.getElementById(activeId);
        activeBtn.classList.add('bg-[#00ff88]', 'text-black');
    },

    /**
     * Prepara a edição de um item
     */
    editItem(type, id) {
        const item = App.state[type].find(i => i.id === id);
        if (item) this.openModal(item);
    },

    /**
     * Mostra mensagens temporárias (Toast)
     */
    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => { t.style.display = 'none'; }, 3000);
    },

    /**
     * Exportação simples de dados (CSV)
     */
    exportData() {
        const allData = [...App.state.faturamentos, ...App.state.despesas, ...App.state.retiradas];
        if (allData.length === 0) return this.showToast("Sem dados para exportar.");

        let csv = "Tipo;Data;Descricao;Valor\n";
        allData.forEach(i => {
            csv += `${i.type};${i.data};${i.descricao};${i.valor}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `VitrinePro_Export_${App.currentMonth + 1}_${App.currentYear}.csv`;
        a.click();
    }
};

window.UI = UI;
