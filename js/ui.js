:root { --neon: #00ff88; --dark: #020617; }

body { 
    font-family: 'Inter', sans-serif; 
    background: var(--dark); 
    color: white; 
    -webkit-tap-highlight-color: transparent;
    overscroll-behavior-y: contain;
}

.card { background: #0f172a; border-radius: 1.5rem; border: 1px solid #1e293b; }

.btn-primary { 
    background: var(--neon); 
    color: black; 
    font-weight: 800; 
    border-radius: 1rem; 
    transition: all 0.2s;
}

.btn-primary:active { transform: scale(0.95); opacity: 0.9; }

.tab-btn { 
    flex: 1; padding: 1rem; text-align: center; font-size: 0.65rem; 
    font-weight: 800; color: #64748b; border-bottom: 2px solid #1e293b; 
    text-transform: uppercase; transition: 0.3s; 
}

.tab-btn.active { 
    color: var(--neon); 
    border-bottom-color: var(--neon); 
    background: linear-gradient(to top, #00ff8811, transparent); 
}

.month-pill { 
    flex: 0 0 auto; padding: 0.5rem 1.2rem; border-radius: 2rem; 
    background: #1e293b; border: 1px solid #334155; font-size: 0.7rem; 
    font-weight: 700; color: #94a3b8; 
}

.month-pill.active { background: var(--neon); color: black; border-color: var(--neon); }

input, select { 
    background: #1e293b !important; border: 1px solid #334155 !important; 
    color: white !important; padding: 0.8rem; border-radius: 1rem; 
    width: 100%; outline: none; 
}

.floating-add { 
    position: fixed; bottom: 30px; right: 20px; 
    width: 64px; height: 64px; 
    background: var(--neon); color: black; 
    border-radius: 20px; display: flex; 
    align-items: center; justify-content: center; 
    font-size: 28px; z-index: 100;
    box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
}

.mei-progress { height: 6px; background: #1e293b; border-radius: 10px; overflow: hidden; }
.mei-bar { height: 100%; background: var(--neon); transition: width 1s ease-in-out; }

.toast { 
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%); 
    background: #1e293b; border: 1px solid var(--neon); padding: 12px 24px; 
    border-radius: 12px; z-index: 1000; display: none; font-weight: bold; 
}

.no-scrollbar::-webkit-scrollbar { display: none; }
