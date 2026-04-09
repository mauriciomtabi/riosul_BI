import React, { useState, useMemo, useEffect } from 'react';
import { rawDataset } from './data';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, AreaChart, Area
} from 'recharts';
import { LayoutDashboard, Truck, LogOut, TrendingUp, TrendingDown, DollarSign, Wallet, Menu, Moon, Sun, Settings, UploadCloud, Database, User, Lock, BarChart2, PieChart as PieChartIcon, Activity, Smartphone } from 'lucide-react';
import './index.css';

const formatNum = (value) => {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

// Abreviação apenas para o Y axis e tabela Frota (12k, 100k, etc)
const formatAbbrev = (value) => {
  if (!value) return '0k';
  return `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
};

const COLORS = ['#ef4444', '#f59e0b', '#10b981'];
const CATEGORY_NAMES = ["Administração Local", "Veículos de Passeio", "Caminhões"];
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [dataSourceType, setDataSourceType] = useState('upload');
  
  // Autenticação mock
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      setIsAuthenticated(true);
    }
  };

  // Filtros
  const [selectedYear, setSelectedYear] = useState('Todos');
  const [selectedQuarter, setSelectedQuarter] = useState('Todos');
  const [selectedMonth, setSelectedMonth] = useState('Todos');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Aplicar tema no body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  // Derivação de dados (Filtragem e Agregação)
  const filteredData = useMemo(() => {
    return rawDataset.filter(item => {
      const matchYear = selectedYear === 'Todos' || item.ano === selectedYear;
      const matchQuarter = selectedQuarter === 'Todos' || item.trimestre === selectedQuarter;
      const matchMonth = selectedMonth === 'Todos' || item.mes === selectedMonth;
      const matchCat = selectedCategory === 'Todas' || item.categoria === selectedCategory;
      return matchYear && matchQuarter && matchMonth && matchCat;
    });
  }, [selectedYear, selectedQuarter, selectedMonth, selectedCategory]);

  const kpis = useMemo(() => {
    let fatP = 0, fatR = 0, desP = 0, desR = 0;
    filteredData.forEach(item => {
      fatP += item.faturamentoPrevisto;
      fatR += item.faturamentoRealizado;
      desP += item.despesaPrevista;
      desR += item.despesaRealizada;
    });
    return {
      faturamento: { previsto: fatP, realizado: fatR },
      despesa: { previsto: desP, realizado: desR },
      margem: { previsto: fatP - desP, realizado: fatR - desR }
    };
  }, [filteredData]);

  const categoriesAggr = useMemo(() => {
    const map = {};
    filteredData.forEach(item => {
      if (!map[item.categoria]) {
        map[item.categoria] = { name: item.categoria, previsto: 0, realizado: 0 };
      }
      map[item.categoria].previsto += item.despesaPrevista;
      map[item.categoria].realizado += item.despesaRealizada;
    });
    return Object.values(map);
  }, [filteredData]);

  const frotaTableData = useMemo(() => {
    const map = {};
    filteredData.forEach(item => {
      if (!map[item.veiculoId]) {
        map[item.veiculoId] = { 
          id: item.veiculoId, 
          veiculo: item.veiculoNome, 
          categoria: item.categoria,
          faturamento: { previsto: 0, realizado: 0 },
          despesa: { previsto: 0, realizado: 0 }
        };
      }
      map[item.veiculoId].faturamento.previsto += item.faturamentoPrevisto;
      map[item.veiculoId].faturamento.realizado += item.faturamentoRealizado;
      map[item.veiculoId].despesa.previsto += item.despesaPrevista;
      map[item.veiculoId].despesa.realizado += item.despesaRealizada;
    });
    return Object.values(map);
  }, [filteredData]);

  const historyAggr = useMemo(() => {
    const map = {};
    const monthsOrder = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    filteredData.forEach(item => {
      // Ignora dados nulos ou com agregados ausentes
      if (!item.ano || !item.mes) return;
      const key = `${item.mes}/${item.ano}`;
      if (!map[key]) {
        map[key] = { label: key, mes: item.mes, ano: item.ano, faturamento: 0, despesa: 0 };
      }
      map[key].faturamento += item.faturamentoRealizado || 0;
      map[key].despesa += item.despesaRealizada || 0;
    });

    const arr = Object.values(map);
    arr.sort((a, b) => {
       if (a.ano !== b.ano) return parseInt(a.ano) - parseInt(b.ano);
       return monthsOrder.indexOf(a.mes) - monthsOrder.indexOf(b.mes);
    });
    return arr;
  }, [filteredData]);

  // Se não estiver logado, renderiza o box de Autenticação isolando o resto do DOM inteiro
  if (!isAuthenticated) {
    return (
      <div className="login-wrapper">
         <div className="login-card">
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <img src="/logo.png" alt="Riosul Logo" style={{ width: '100%', maxWidth: '200px' }} />
              <p style={{ color: 'var(--text-muted)', marginTop: '15px' }}>Sistema Analítico Corporativo. Autentique-se para continuar.</p>
            </div>
            <form onSubmit={handleLogin}>
               <div className="login-input-group">
                 <label>E-mail Corporativo</label>
                 <div style={{ position: 'relative' }}>
                   <div className="login-icon-wrap" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', display: 'flex', alignItems: 'center' }}><User size={18}/></div>
                   <input type="email" placeholder="nome.sobrenome@riosul.com.br" className="login-input" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                 </div>
               </div>
               <div className="login-input-group">
                 <label>Senha de Acesso</label>
                 <div style={{ position: 'relative' }}>
                   <div className="login-icon-wrap" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '16px', display: 'flex', alignItems: 'center' }}><Lock size={18}/></div>
                   <input type="password" placeholder="••••••••••••" className="login-input" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                 </div>
               </div>
               <div className="flex-between" style={{ marginBottom: '25px', fontSize: '0.9rem' }}>
                 <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <input type="checkbox" style={{ accentColor: 'var(--riosul-green)' }} /> Lembrar credenciais
                 </label>
                 <a href="#reset" style={{ color: 'var(--riosul-green)', textDecoration: 'none', fontWeight: 500 }}>Esqueceu a senha?</a>
               </div>
               <button type="submit" className="login-btn">
                 Validar e Iniciar Sessão
               </button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
        <div className="sidebar-logo" style={{ marginBottom: '30px', display: 'flex', justifyContent: 'center' }}>
          {isSidebarOpen ? (
             <img src="/logo.png" alt="Grupo Riosul" style={{ width: '100%', maxWidth: '200px', objectFit: 'contain' }} />
          ) : (
             <img src="https://i.postimg.cc/d0xWDgBQ/Grupo-RIO-SUL-Logo-23.png" alt="Riosul" style={{ width: '40px', objectFit: 'contain' }} />
          )}
        </div>
        <ul className="nav-menu">
          <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} title="Visão Geral">
            <LayoutDashboard size={20} /> <span className="sidebar-text">Visão Geral</span>
          </li>
          <li className={`nav-item ${activeTab === 'frota' ? 'active' : ''}`} onClick={() => setActiveTab('frota')} title="Gestão de Frota">
            <Truck size={20} /> <span className="sidebar-text">Gestão de Frota</span>
          </li>
          <li className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} title="Configurações">
            <Settings size={20} /> <span className="sidebar-text">Configurações</span>
          </li>
          <li className={`nav-item ${activeTab === 'install' ? 'active' : ''}`} onClick={() => setActiveTab('install')} title="Instalar App">
            <Smartphone size={20} /> <span className="sidebar-text">Instalar</span>
          </li>
          <div className="mobile-logout-spacer"></div>
          <li className="nav-item" title="Sair" onClick={() => setIsAuthenticated(false)}>
            <LogOut size={20} /> <span className="sidebar-text">Sair</span>
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header" style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'var(--bg-dark)', margin: 0, padding: '15px 40px', borderBottom: '1px solid var(--card-border)' }}>
          <div className="flex-between" style={{ alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button title="Recolher/Expandir Menu" onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Menu size={28} />
              </button>
              <div>
                <h1 style={{ marginBottom: 0 }}>
                  {activeTab === 'dashboard' ? 'Dashboard Executivo' : activeTab === 'settings' ? 'Configuração' : activeTab === 'install' ? 'Aplicativo' : 'Gestão de Frota'}
                </h1>
              </div>
            </div>
            
            <button title="Modo Claro/Escuro" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
          
          {(activeTab === 'dashboard' || activeTab === 'frota') && (
            <div className="period-selector">
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="custom-select">
              <option value="Todos">Ano: Todos</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
            <select value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="custom-select">
              <option value="Todos">Trimestre: Todos</option>
              <option value="T1">T1</option>
              <option value="T2">T2</option>
              <option value="T3">T3</option>
              <option value="T4">T4</option>
            </select>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="custom-select">
              <option value="Todos">Mês: Todos</option>
              {MONTH_NAMES.map((m, i) => (
                <option key={i+1} value={(i+1).toString()}>{m}</option>
              ))}
            </select>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="custom-select">
              <option value="Todas">Categoria: Todas</option>
              {CATEGORY_NAMES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          )}
        </header>

        <div style={{ padding: '15px 40px 40px 40px' }}>
          {activeTab === 'dashboard' && (
          <>
            {/* KPIs */}
            <div className="grid-cards">
              <div className="card glow-blue" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div className="icon-box blue" style={{ marginBottom: 0 }}>
                    <Wallet size={24} />
                  </div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Faturamento Total
                  </div>
                </div>
                <div className="card-value">{formatNum(kpis.faturamento.realizado)}</div>
                <div style={{ marginTop: 'auto' }}>
                  <div className="card-subtext">
                    Meta: {formatNum(kpis.faturamento.previsto)}
                    {kpis.faturamento.previsto > 0 && (
                      <span className={kpis.faturamento.realizado >= kpis.faturamento.previsto ? 'text-green' : 'text-red'} style={{ marginLeft: 'auto', fontWeight: 600 }}>
                        {((kpis.faturamento.realizado / kpis.faturamento.previsto) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ 
                      width: kpis.faturamento.previsto > 0 ? `${Math.min((kpis.faturamento.realizado / kpis.faturamento.previsto) * 100, 100)}%` : '0%',
                      backgroundColor: kpis.faturamento.realizado >= kpis.faturamento.previsto ? 'var(--riosul-green)' : 'var(--riosul-yellow)'
                    }}></div>
                  </div>
                </div>
              </div>

              <div className="card glow-red" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div className="icon-box red" style={{ marginBottom: 0 }}>
                    <TrendingDown size={24} />
                  </div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Despesas Totais
                  </div>
                </div>
                <div className="card-value">{formatNum(kpis.despesa.realizado)}</div>
                <div style={{ marginTop: 'auto' }}>
                  <div className="card-subtext">
                    Orçamento: {formatNum(kpis.despesa.previsto)}
                    {kpis.despesa.previsto > 0 && (
                       <span className={kpis.despesa.realizado <= kpis.despesa.previsto ? 'text-green' : 'text-red'} style={{ marginLeft: 'auto', fontWeight: 600 }}>
                         {((kpis.despesa.realizado / kpis.despesa.previsto) * 100).toFixed(1)}%
                       </span>
                    )}
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ 
                      width: kpis.despesa.previsto > 0 ? `${Math.min((kpis.despesa.realizado / kpis.despesa.previsto) * 100, 100)}%` : '0%',
                      backgroundColor: kpis.despesa.realizado <= kpis.despesa.previsto ? 'var(--riosul-green)' : 'var(--riosul-red)'
                    }}></div>
                  </div>
                </div>
              </div>

              <div className="card glow-green" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div className="icon-box green" style={{ marginBottom: 0 }}>
                    <TrendingUp size={24} />
                  </div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Margem
                  </div>
                </div>
                <div className={`card-value ${kpis.margem.realizado > 0 ? 'text-green' : 'text-red'}`}>
                  {formatNum(kpis.margem.realizado)}
                </div>
                <div style={{ marginTop: 'auto' }}>
                  <div className="card-subtext">
                    Previsto: {formatNum(kpis.margem.previsto)}
                    {kpis.margem.previsto > 0 && (
                      <span className={kpis.margem.realizado >= kpis.margem.previsto ? 'text-green' : 'text-red'} style={{ marginLeft: 'auto', fontWeight: 600 }}>
                        {((kpis.margem.realizado / kpis.margem.previsto) * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ 
                      width: kpis.margem.previsto > 0 ? `${Math.min((kpis.margem.realizado / kpis.margem.previsto) * 100, 100)}%` : '0%',
                      backgroundColor: kpis.margem.realizado >= kpis.margem.previsto ? 'var(--riosul-green)' : 'var(--riosul-red)'
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid-charts">
              {/* HISTORICAL CHART - FULL WIDTH */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <div className="icon-box green" style={{ marginBottom: 0 }}>
                    <Activity size={24} />
                  </div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Evolução Histórica do Período
                  </div>
                </div>
                <div style={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer>
                    <AreaChart data={historyAggr} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--riosul-green)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--riosul-green)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--riosul-red)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--riosul-red)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                      <XAxis dataKey="label" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" width={80} tickFormatter={(value) => formatAbbrev(value)} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                        formatter={(value) => formatNum(value)}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="faturamento" name="Faturamento Realizado" stroke="var(--riosul-green)" fillOpacity={1} fill="url(#colorFat)" />
                      <Area type="monotone" dataKey="despesa" name="Despesa Realizada" stroke="var(--riosul-red)" fillOpacity={1} fill="url(#colorDes)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <div className="icon-box blue" style={{ marginBottom: 0 }}>
                    <BarChart2 size={24} />
                  </div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Previsto versus Realizado das Despesas por Categoria
                  </div>
                </div>
                <div style={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer>
                    <BarChart data={categoriesAggr} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                      <XAxis dataKey="name" stroke="var(--text-muted)" />
                      <YAxis stroke="var(--text-muted)" width={80} tickFormatter={(value) => formatAbbrev(value)} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }}
                        formatter={(value) => formatNum(value)}
                      />
                      <Legend />
                      <Bar dataKey="previsto" name="Despesa Orçada" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="previsto" position="top" fill="var(--text-main)" fontSize={12} formatter={(value) => formatAbbrev(value)} />
                      </Bar>
                      <Bar dataKey="realizado" name="Despesa Realizada" fill="#ef4444" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="realizado" position="top" fill="var(--text-main)" fontSize={12} formatter={(value) => formatAbbrev(value)} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                  <div className="icon-box red" style={{ marginBottom: 0 }}>
                    <PieChartIcon size={24} />
                  </div>
                  <div className="card-title" style={{ marginBottom: 0 }}>
                    Composição de Gastos
                  </div>
                </div>
                <div style={{ height: 350, width: '100%', position: 'relative', marginTop: 'auto' }}>
                  {categoriesAggr.length === 0 ? (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-muted)' }}>Sem dados</div>
                  ) : (
                    <ResponsiveContainer>
                      <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                        <Pie
                          data={categoriesAggr}
                          cx="50%"
                          cy="50%"
                          innerRadius="45%"
                          outerRadius="75%"
                          paddingAngle={5}
                          dataKey="realizado"
                          nameKey="name"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {categoriesAggr.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value) => formatNum(value)} contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--text-main)' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'frota' && (
          <div className="card" style={{ padding: '0' }}>
            <div className="table-container">
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Ativo / Centro de Custo</th>
                    <th>Categoria</th>
                    <th>Faturamento</th>
                    <th>Despesas</th>
                    <th>Margem</th>
                  </tr>
                </thead>
                <tbody>
                  {frotaTableData.map((item) => {
                    const res = item.faturamento.realizado - item.despesa.realizado;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 500 }}>{item.veiculo}</td>
                        <td>
                          <span style={{ backgroundColor: 'var(--hover-bg)', border: '1px solid var(--card-border)', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                            {item.categoria}
                          </span>
                        </td>
                        <td>
                          <div className="flex-between">
                            <span>{formatAbbrev(item.faturamento.realizado)}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>Meta: {formatAbbrev(item.faturamento.previsto)}</span>
                          </div>
                          <div className="progress-container" style={{ height: '4px', marginTop: '4px' }}>
                            <div className="progress-bar" style={{ 
                              width: `${Math.min((item.faturamento.realizado / (item.faturamento.previsto || 1)) * 100, 100)}%`,
                              backgroundColor: item.faturamento.realizado >= item.faturamento.previsto ? 'var(--riosul-green)' : 'var(--riosul-yellow)'
                            }}></div>
                          </div>
                        </td>
                        <td>
                          <div className="flex-between">
                            <span>{formatAbbrev(item.despesa.realizado)}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>Orçamento: {formatAbbrev(item.despesa.previsto)}</span>
                          </div>
                          <div className="progress-container" style={{ height: '4px', marginTop: '4px' }}>
                            <div className="progress-bar" style={{ 
                              width: `${Math.min((item.despesa.realizado / (item.despesa.previsto || 1)) * 100, 100)}%`,
                              backgroundColor: item.despesa.realizado <= item.despesa.previsto ? 'var(--riosul-green)' : 'var(--riosul-red)'
                            }}></div>
                          </div>
                        </td>
                        <td style={{ fontWeight: 'bold', color: res > 0 ? 'var(--riosul-green)' : (res < 0 ? 'var(--riosul-red)' : 'var(--text-muted)') }}>
                          {formatAbbrev(res)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
               <Settings size={24} /> Configuração de Origem de Dados
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>
              Defina como o painel Business Intelligence será alimentado com os relatórios consolidados no futuro.
            </p>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
               <div 
                  onClick={() => setDataSourceType('upload')}
                  style={{ flex: 1, padding: '20px', border: `2px solid ${dataSourceType === 'upload' ? 'var(--riosul-green)' : 'var(--card-border)'}`, borderRadius: '12px', cursor: 'pointer', backgroundColor: dataSourceType === 'upload' ? 'rgba(16, 185, 129, 0.05)' : 'transparent', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <UploadCloud size={32} color={dataSourceType === 'upload' ? 'var(--riosul-green)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Upload de Arquivo</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Alimentar dados arrastando arquivo DRE (Excel/CSV) configurado.</div>
                  </div>
               </div>
               <div 
                  onClick={() => setDataSourceType('api')}
                  style={{ flex: 1, padding: '20px', border: `2px solid ${dataSourceType === 'api' ? 'var(--riosul-green)' : 'var(--card-border)'}`, borderRadius: '12px', cursor: 'pointer', backgroundColor: dataSourceType === 'api' ? 'rgba(16, 185, 129, 0.05)' : 'transparent', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Database size={32} color={dataSourceType === 'api' ? 'var(--riosul-green)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>Conexão de API ERP</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Conectar dados vivos do sistema de gestão com Web-tokens.</div>
                  </div>
               </div>
            </div>

            {dataSourceType === 'upload' ? (
              <div style={{ padding: '40px', border: '2px dashed var(--card-border)', borderRadius: '12px', textAlign: 'center', backgroundColor: 'var(--hover-bg)' }}>
                 <UploadCloud size={48} color="var(--text-muted)" style={{ margin: '0 auto 15px' }} />
                 <h3 style={{ marginBottom: '10px' }}>Arraste o arquivo estruturado do DRE aqui</h3>
                 <p style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>Formatos aceitos: .xlsx, .csv até 50MB.</p>
                 <button style={{ backgroundColor: 'var(--riosul-green)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Selecionar Arquivo</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>URL do Endpoint (API Rest)</label>
                  <input type="text" placeholder="https://api.riosul.com.br/v1/dre/metrics" style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--hover-bg)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Access Token (Bearer Auth)</label>
                  <input type="password" placeholder="••••••••••••••••••••••••" style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', border: '1px solid var(--card-border)', backgroundColor: 'var(--hover-bg)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }} />
                </div>
                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                  <button style={{ backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--card-border)', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Restaurar Padrões</button>
                  <button style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Executar Sincronização</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'install' && (
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div className="icon-box green" style={{ width: '70px', height: '70px', borderRadius: '20px', marginBottom: 0 }}>
                <Smartphone size={36} />
              </div>
            </div>
            <h2 style={{ marginBottom: '15px' }}>Instalar Aplicativo Oficial</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: '1.6' }}>
              Tenha o Dashboard Analítico e Gestão de Frotas da Riosul diretamente na tela inicial do seu dispositivo. Um ícone exclusivo será criado para acesso unificado e visual em tela cheia.
            </p>

            {isIOS ? (
              <div style={{ backgroundColor: 'var(--hover-bg)', padding: '25px', borderRadius: '12px', textAlign: 'left', border: '1px solid var(--card-border)' }}>
                <h4 style={{ marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={20} color="var(--text-main)" /> Instruções Obrigatórias (iPhone/iPad)
                </h4>
                <p style={{ color: 'var(--text-muted)', marginBottom: '15px', fontSize: '0.9rem' }}>
                  A Apple bloqueia a instalação via botão neste navegador. Por favor siga os 2 passos rápidos:
                </p>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>1. Toque no ícone de <strong>Compartilhar</strong> (o pequeno quadrado com uma seta para cima) posicionado na aba inferior do painel do Safari.</p>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>2. Role levemente para baixo no menu e selecione a opção <strong>"Adicionar à Tela de Início"</strong>. E pronto!</p>
                </div>
              </div>
            ) : (
              <div>
                {deferredPrompt ? (
                  <button className="login-btn" onClick={handleInstallClick} style={{ width: 'auto', padding: '15px 50px', fontSize: '1.1rem', boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}>
                    Baixar e Instalar App
                  </button>
                ) : (
                  <div style={{ backgroundColor: 'var(--hover-bg)', padding: '20px', borderRadius: '12px', display: 'inline-block' }}>
                      <p style={{ color: 'var(--text-muted)' }}>✓ Você já possui o app instalado ou está num dispositivo incompatível.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-select {
          padding: 8px 16px;
          border-radius: 8px;
          background-color: var(--card-bg);
          color: var(--text-main);
          border: 1px solid var(--card-border);
          font-family: 'Inter', sans-serif;
          font-size: 0.95rem;
        }
      `}} />
    </div>
  );
}

export default App;
