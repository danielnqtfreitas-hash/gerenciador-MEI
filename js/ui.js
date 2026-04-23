const UI = {
    activeTab: 'resumo',
    selectedMonth: null,
    selectedYear: new Date().getFullYear(),
    chartObj: null,

    toggleView(mode) {
        document.getElementById('auth-screen').style.display = mode === 'login' ? 'flex' : 'none';
        document.getElementById('app-content').style.display = mode === 'app' ? 'block' : 'none';
    },

    showToast(msg) {
        const t = document.getElementById('toast');
        t.innerText = msg;
        t.style.display = 'block';
        setTimeout(() => t.style.display = 'none', 2500);
    },

    renderAll(state) {
        this.updateYearDropdown(state);
        this.renderMonthSelector();
        this.applyFilters(state);
    },

    updateYearDropdown(state) {
        const years = new Set([new Date().getFullYear()]);
        [...state.faturamentos, ...state.despesas, ...state.retiradas].forEach(i => {
            if(i.data) years.add(new Date(i.data + "T00:00:00").getFullYear());
        });
        const sorted = Array.from(years).sort((a,b) => b - a);
        document.getElementById('year-filter').innerHTML = sorted.map(y => 
            `<option value="${y}" ${y === this.selectedYear ? 'selected' : ''}>${y}</option>`
        ).join('');
    },

    renderMonthSelector() {
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        document.getElementById('month-selector').innerHTML = 
            `<div class="month-pill ${this.selectedMonth === null ? 'active' : ''}" onclick="UI.filterByMonth(null)">Todos</div>` + 
            meses.map((m, i) => `<div class="month-pill ${this.selectedMonth === i ? 'active' : ''}" onclick="UI.filterByMonth(${i})">${m}</div>`).join('');
    },

    filterByMonth(m) { this.selectedMonth = m; App.refreshUI(); },
    filterByYear(y) { this.selectedYear = parseInt(y); App.refreshUI(); },

    applyFilters(state) {
        const MEI_LIMIT = 81000;
        
        // Cálculos de Totais
        const histF = state.faturamentos.reduce((a, b) => a + (b.valor || 0), 0);
        const histD = state.despesas.reduce((a, b) => a + (b.valor || 0), 0);
        const histR = state.retiradas.reduce((a, b) => a + (b.valor || 0), 0);
        
        document.getElementById('saldo-disponivel').innerText = this.formatBRL(histF - histD - histR);

        // Filtro de tempo
        const filterFn = (x) => {
            const d = new Date(x.data + "T00:00:00");
            return d.getFullYear() === this.selectedYear && (this.selectedMonth === null || d.getMonth() === this.selectedMonth);
        };

        const tF = state.faturamentos.filter(filterFn).reduce((a, b) => a + (b.valor || 0), 0);
        const tD = state.despesas.filter(filterFn).reduce((a, b) => a + (b.valor || 0), 0);
        const tR = state.retiradas.filter(filterFn).reduce((a, b) => a + (b.valor || 0), 0);

        // Atualiza Cards
        document.getElementById('total-f').innerText = this.formatBRL(tF);
        document.getElementById('total-d').innerText = this.formatBRL(tD);
        document.getElementById('total-r').innerText = this.formatBRL(tR);

        this.renderChart(tF, tD, tR);
        if(this.activeTab !== 'resumo') this.renderList(state[this.activeTab].filter(filterFn));
    },

    formatBRL(v) { return v.toLocaleString('pt-br', { style: 'currency', currency: 'BRL' }); },

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
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    },

    renderList(data) {
        const list = document.getElementById('items-list');
        list.innerHTML = data.length === 0 ? `<div class="py-20 text-center opacity-20 text-[10px] font-black italic">Vazio no período</div>` : '';
        // ... (resto da lógica de criar as DIVs de cada item do seu código original)
    }
};
