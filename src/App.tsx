import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, CalendarDays, Info, ArrowLeft, CalendarClock, MinusCircle, PlusCircle, AlertTriangle, ChevronDown, ChevronUp, FileText, HelpCircle, MapPin, User, Code, BookOpen } from 'lucide-react';

// --- CONFIGURAÇÃO DE FERIADOS E RECESSO (COM NOMES PARA EXIBIÇÃO) ---

const HOLIDAYS_2025_DETAILS = [
  { date: "2025-03-03", name: "Suspensão de Expediente" },
  { date: "2025-03-04", name: "Carnaval" },
  { date: "2025-04-17", name: "Endoenças" },
  { date: "2025-04-18", name: "Paixão de Cristo" },
  { date: "2025-04-21", name: "Tiradentes" },
  { date: "2025-05-01", name: "Dia do Trabalho" },
  { date: "2025-05-02", name: "Suspensão de Expediente" },
  { date: "2025-06-19", name: "Corpus Christi" },
  { date: "2025-06-20", name: "Suspensão de Expediente" },
  { date: "2025-07-09", name: "Data Magna SP" },
  { date: "2025-10-28", name: "Dia do Servidor Público" },
  { date: "2025-11-20", name: "Dia da Consciência Negra" },
  { date: "2025-11-21", name: "Suspensão de Expediente" },
];

const HOLIDAYS_2026_DETAILS = [
  { date: "2026-02-16", name: "Carnaval" },
  { date: "2026-02-17", name: "Carnaval" },
  { date: "2026-04-02", name: "Endoenças" },
  { date: "2026-04-03", name: "Sexta-feira Santa" },
  { date: "2026-04-20", name: "Suspensão de Expediente" },
  { date: "2026-04-21", name: "Tiradentes" },
  { date: "2026-05-01", name: "Dia do Trabalho" },
  { date: "2026-06-04", name: "Corpus Christi" },
  { date: "2026-06-05", name: "Suspensão de Expediente" },
  { date: "2026-07-09", name: "Data Magna SP" },
  { date: "2026-07-10", name: "Suspensão de Expediente" },
  { date: "2026-09-07", name: "Independência do Brasil" },
  { date: "2026-10-12", name: "N. Sra. Aparecida" },
  { date: "2026-10-28", name: "Dia do Servidor Público" },
  { date: "2026-11-02", name: "Finados" },
  { date: "2026-11-20", name: "Dia da Consciência Negra" },
];

const FIXED_HOLIDAYS = [
  "01-01", // Ano Novo
  "04-21", // Tiradentes
  "05-01", // Trabalho
  "09-07", // Independência
  "10-12", // Aparecida
  "11-02", // Finados
  "11-15", // Proclamação
  "12-25", // Natal
];

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const YEAR_OPTIONS = [2024, 2025, 2026, 2027];
const DAY_OPTIONS = Array.from({ length: 32 }, (_, i) => i); // 0 a 31

export default function TCECalculator() {
  // Lógica para definir o mês inicial como o SUBSEQUENTE ao atual
  const getInitialState = () => {
    const now = new Date();
    let m = now.getMonth() + 1; // Mês atual + 1
    let y = now.getFullYear();

    // Virada de ano (Se for Dezembro + 1 = 13, vira Janeiro do próximo ano)
    if (m > 11) {
      m = 0;
      y += 1;
    }
    return { month: m, year: y };
  };

  const initial = getInitialState();

  // Estado agora representa o MÊS DO PAGAMENTO
  const [payMonth, setPayMonth] = useState<number>(initial.month);
  const [payYear, setPayYear] = useState<number>(initial.year);
  
  const [absences, setAbsences] = useState<number>(0);
  const [extraHolidays, setExtraHolidays] = useState<number>(0);
  const [isFirstMonth, setIsFirstMonth] = useState<boolean>(false);
  const [startDay, setStartDay] = useState<number>(1);
  const [showHolidaysList, setShowHolidaysList] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(true);
  
  const [results, setResults] = useState({
    bolsa: 0,
    transport: 0,
    vrTotal: 0,
    total: 0,
    details: {
      bolsaFormula: "",
      vtDays: 0,
      vrCredit: 0,
      vrDebit: 0,
      vrDebitDays: 0,
      workedDays: 0,
      refMonthName: "",
      advanceMonthName: ""
    }
  });

  const BOLSA_FULL = 1443.00;
  const VR_VALUE = 39.75;
  const VT_VALUE = 17.80;

  // --- Helpers de Data ---

  // Retorna o mês/ano de referência (anterior ao pagamento)
  const getRefDate = () => {
    let m = payMonth - 1;
    let y = payYear;
    if (m < 0) {
      m = 11;
      y = payYear - 1;
    }
    return { m, y };
  };

  // Retorna o nome do mês do adiantamento (Próximo mês relativo ao pagamento)
  const getAdvanceMonthName = () => {
    let m = payMonth + 1;
    if (m > 11) m = 0;
    return MONTH_NAMES[m];
  }

  const isHolidayOrRecess = (date: Date) => {
    const day = date.getDate();
    const m = date.getMonth();
    const y = date.getFullYear();
    const dateString = date.toISOString().split('T')[0];
    const monthDay = `${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Recesso 2024/2025
    if (y === 2024 && m === 11 && day >= 20) return true;
    if (y === 2025 && m === 0 && day <= 6) return true;

    // Recesso 2025/2026 (Ato 03/2025)
    if (y === 2025 && m === 11 && day >= 22) return true;
    if (y === 2026 && m === 0 && day <= 9) return true;

    // Recesso 2026/2027 (Ato 14/2025)
    if (y === 2026 && m === 11 && day >= 21) return true;
    if (y === 2027 && m === 0 && day <= 8) return true;

    // Feriados Específicos
    if (y === 2025 && HOLIDAYS_2025_DETAILS.some(h => h.date === dateString)) return true;
    if (y === 2026 && HOLIDAYS_2026_DETAILS.some(h => h.date === dateString)) return true;
    
    // Feriados Fixos
    if (![2025, 2026].includes(y) && FIXED_HOLIDAYS.includes(monthDay)) return true;

    return false;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getMonthStats = (m: number, y: number, startDayNum: number = 1) => {
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    let businessDays = 0; // Dias úteis reais (sem feriado/recesso)
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const isWknd = isWeekend(date);
      const isHol = isHolidayOrRecess(date);

      // Conta apenas dias úteis a partir do início
      if (d >= startDayNum) {
        if (!isWknd && !isHol) {
          businessDays++;
        }
      }
    }
    
    return { businessDays };
  };

  // --- Lógica de Cálculo ---

  useEffect(() => {
    calculate();
  }, [payMonth, payYear, absences, extraHolidays, isFirstMonth, startDay]);

  const calculate = () => {
    const { m: refM, y: refY } = getRefDate();
    const refMonthName = `${MONTH_NAMES[refM]}/${refY}`;
    const advanceMonthName = getAdvanceMonthName();
    
    // Estatísticas do Mês de REFERÊNCIA (Trabalhado)
    const stats = getMonthStats(refM, refY, isFirstMonth ? startDay : 1);
    
    // Dias efetivamente trabalhados no mês de referência
    // (Dias Úteis Calendário - Feriados Extras Manuais - Faltas)
    const workedDays = Math.max(0, stats.businessDays - extraHolidays - absences);

    // 1. BOLSA AUXÍLIO
    // Baseada no mês de referência
    let bolsa = 0;
    let bolsaDesc = "";
    const dailyBolsa = BOLSA_FULL / 30;
    
    if (isFirstMonth) {
      // Fórmula: (30 - (DiaInicio - 1)) * (Valor / 30) - Faltas
      const daysConsidered = 30 - (startDay - 1);
      bolsa = (daysConsidered * dailyBolsa) - (absences * dailyBolsa);
      bolsaDesc = `Proporcional ao mês de ${MONTH_NAMES[refM]} (${daysConsidered}/30 dias) - Faltas`;
    } else {
      // Integral - Faltas
      bolsa = BOLSA_FULL - (absences * dailyBolsa);
      bolsaDesc = ""; 
    }
    
    // 2. AUXÍLIO TRANSPORTE (VT)
    // Reembolso dos dias trabalhados no mês de referência
    const vtTotal = workedDays * VT_VALUE;

    // 3. AUXÍLIO ALIMENTAÇÃO (VR)
    let vrTotal = 0;
    let vrCredit = 0;
    let vrDebit = 0;
    let vrDebitDays = 0;

    if (isFirstMonth) {
      // Regra Primeiro Pagamento: 
      // Retroativo (Dias Trabalhados Ref) + Adiantamento (22 Dias Próx)
      vrCredit = (workedDays * VR_VALUE) + (22 * VR_VALUE);
      vrTotal = vrCredit;
    } else {
      // Regra Pagamentos Seguintes:
      // Crédito Fixo: 22 dias (Referente ao mês do pagamento/futuro)
      // Débito: Ajuste do mês de referência (22 - Dias Trabalhados na Ref)
      
      vrCredit = 22 * VR_VALUE;
      
      // Se trabalhou menos de 22 dias na referência, desconta a diferença
      vrDebitDays = Math.max(0, 22 - workedDays);
      vrDebit = vrDebitDays * VR_VALUE;
      
      vrTotal = Math.max(0, vrCredit - vrDebit);
    }

    setResults({
      bolsa: Math.max(0, bolsa),
      transport: Math.max(0, vtTotal),
      vrTotal: Math.max(0, vrTotal),
      total: Math.max(0, bolsa + vtTotal + vrTotal),
      details: {
        bolsaFormula: bolsaDesc,
        vtDays: workedDays,
        vrCredit,
        vrDebit,
        vrDebitDays,
        workedDays,
        refMonthName,
        advanceMonthName
      }
    });
  };

  const getRefMonthName = () => {
    const { m } = getRefDate();
    return MONTH_NAMES[m];
  };

  const getPaymentDateString = () => {
    return `15 de ${MONTH_NAMES[payMonth]}`;
  };

  const formatDate = (dateString: string) => {
    const [y, m, d] = dateString.split('-');
    return `${d}/${m}`;
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-800 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header - SIMPLIFICADO */}
        <div className="bg-gradient-to-br from-red-900 to-red-800 p-6 text-white flex flex-col items-center justify-center gap-4 text-center relative overflow-hidden">
          {/* Background Pattern decoration */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
          
          <h1 className="text-xl md:text-3xl font-bold flex flex-col md:flex-row items-center gap-3 relative z-10">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm shadow-inner">
              <Calculator className="w-8 h-8" />
            </div>
            Calculadora de Salário - Estágio TCE-SP
          </h1>
        </div>

        {/* ABA EXPLICATIVA (HELP) REFORMULADA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 p-6 flex flex-col md:flex-row items-start gap-4">
            <div className="bg-indigo-100 p-2 rounded-full shrink-0 hidden md:block shadow-sm">
                <HelpCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-sm text-indigo-900 leading-relaxed w-full">
              <h3 className="font-bold text-lg text-indigo-800 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 md:hidden text-indigo-600" />
                Como funciona?
              </h3>
              <p className="text-indigo-800/80">
                Esta calculadora estima o valor do pagamento que será recebido no dia 15 do mês selecionado. 
                <br className="hidden md:block"/> <strong>Exemplo:</strong> Ao selecionar Janeiro de 2026, você saberá quanto receberá em 15 de janeiro de 2026, que será o pagamento referente
                ao mês trabalhado de Dezembro.  
              </p>
            </div>
        </div>

        {/* Developer Credit */}
        <div className="bg-slate-50 px-6 py-2 border-b border-gray-200 text-center">
          <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5 flex-wrap">
            <Code className="w-3 h-3" /> Desenvolvido por <strong className="text-slate-700">Gabriel Zaneta Pinheiro - UR-2.5 Bauru-SP</strong>
          </span>
        </div>

        <div className="p-4 md:p-8 grid gap-8 md:grid-cols-2">
          
          {/* Coluna Esquerda: Inputs */}
          <div className="space-y-6">
            
            {/* Bloco 1: Data do Pagamento */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm border-l-4 border-l-red-800 hover:shadow-md transition-shadow">
              <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-lg uppercase">
                1 - Selecione a Data do Pagamento
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-3 relative">
                <div className="relative flex-1">
                  <select 
                    value={payMonth} 
                    onChange={(e) => setPayMonth(parseInt(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-gray-300 p-3 pr-10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white hover:border-gray-400 transition-all cursor-pointer h-12 shadow-sm text-gray-700 font-medium"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
                
                <div className="relative w-full sm:w-36">
                  <select
                    value={payYear} 
                    onChange={(e) => setPayYear(parseInt(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-gray-300 p-3 pr-10 text-center font-bold bg-white hover:border-gray-400 transition-all cursor-pointer focus:ring-2 focus:ring-red-500/20 focus:border-red-500 h-12 shadow-sm text-gray-700"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Bloco 2: Frequência */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-200/60 pb-2 uppercase">
                2 - Faltas Injustificadas ou Feriados Locais
              </h3>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-red-100">
                  <label className="text-sm font-bold text-gray-700 block mb-2">
                    Faltas Injustificadas em <span className="text-red-600">{getRefMonthName()}</span>
                  </label>
                  
                  <div className="relative">
                    <select 
                      value={absences} 
                      onChange={(e) => setAbsences(parseInt(e.target.value))}
                      className="w-full appearance-none rounded-xl border border-gray-300 p-3 pr-10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white hover:border-gray-400 transition-all cursor-pointer h-12 shadow-sm text-gray-700"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                  
                  {/* NOTA DESTAQUE SOBRE FALTAS */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 relative overflow-hidden group">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                        <strong className="block text-amber-700 mb-1">Cálculo de faltas em desenvolvimento</strong>
                        Ainda não sei como o TCE desconta as faltas. Caso você tenha alguma falta injustificada, mande-me uma mensagem no Teams (Gabriel Zaneta) para eu ver como a descontaram e adicionar essa função à calculadora.
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-red-100">
                  <label className="text-sm font-bold text-gray-700 block mb-2">
                    Feriados Locais em <span className="text-red-600">{getRefMonthName()}</span>
                  </label>
                  
                  <div className="relative">
                    <select 
                      value={extraHolidays} 
                      onChange={(e) => setExtraHolidays(parseInt(e.target.value))}
                      className="w-full appearance-none rounded-xl border border-gray-300 p-3 pr-10 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 bg-white hover:border-gray-400 transition-all cursor-pointer h-12 shadow-sm text-gray-700"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-5 h-5 text-gray-500 absolute right-3 top-3.5 pointer-events-none" />
                  </div>
                  
                  <div className="mt-3 flex gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <BookOpen className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                    <p>
                        Informe a quantidade de feriados locais sem expediente em <span className="text-red-600 font-bold">{getRefMonthName()}</span> que não constam no Calendário de Suspensão de Expediente (disponível ao final da página).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 shadow-sm flex flex-col items-center text-center hover:bg-orange-50/80 transition-colors">
              <div className="mb-4 w-full">
                <label className="block font-bold text-gray-800 mb-3 text-lg">É o Primeiro Pagamento?</label>
                <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-orange-200 inline-flex justify-center shadow-sm">
                  <button
                    onClick={() => setIsFirstMonth(true)}
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      isFirstMonth 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setIsFirstMonth(false)}
                    className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      !isFirstMonth 
                        ? 'bg-orange-500 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {isFirstMonth && (
                <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t border-orange-200 mt-2 w-full text-left">
                  <p className="text-sm text-gray-600 mb-3 font-medium">
                    Dia que você começou em <span className="text-red-600 font-bold">{getRefMonthName()}</span>:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar p-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        onClick={() => setStartDay(day)}
                        className={`w-10 h-10 rounded-lg text-sm font-bold transition-all shadow-sm ${
                          startDay === day 
                            ? 'bg-orange-600 text-white shadow-md scale-105' 
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-orange-100 hover:border-orange-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Coluna Direita: Resultados (DEMONSTRATIVO FINANCEIRO) - DESTAQUE */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-2xl border-2 border-red-50 overflow-hidden relative flex flex-col h-full transform transition-transform hover:scale-[1.01] duration-300">
              
              <div className="bg-green-50 px-6 py-4 border-b border-green-200 flex justify-between items-center">
                <span className="font-extrabold text-gray-900 flex items-center gap-2 text-lg uppercase tracking-wide">
                  <DollarSign className="w-6 h-6 text-green-600 fill-green-100" /> Demonstrativo Financeiro
                </span>
                <span className="text-[10px] bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-green-200 shadow-sm">Estimativa</span>
              </div>
              
              <div className="p-6 space-y-6 relative z-10 grow flex flex-col justify-start">
                
                {/* 1. Bolsa-Auxílio */}
                <div className="border border-slate-300 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start group">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg group-hover:text-red-700 transition-colors uppercase">BOLSA-AUXÍLIO</h4>
                      {results.details.bolsaFormula && (
                        <p className="text-xs text-gray-500 mt-1">{results.details.bolsaFormula}</p>
                      )}
                    </div>
                    <span className="font-bold text-xl text-gray-800 whitespace-nowrap">
                      = R$ {results.bolsa.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* 2. Auxílio Alimentação */}
                <div className="border border-slate-300 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <h4 className="font-bold text-gray-800 text-lg uppercase">AUXÍLIO ALIMENTAÇÃO</h4>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 bg-gray-50 px-2 py-0.5 rounded w-fit border border-gray-100">R$ {VR_VALUE.toString().replace('.', ',')}/dia útil</span>
                    </div>
                    <span className="font-bold text-xl text-gray-800 whitespace-nowrap">
                      = R$ {results.vrTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-3 pt-2 border-t border-dashed border-gray-200">
                    {isFirstMonth ? (
                      <>
                        <div className="flex justify-between items-start">
                           <div className="flex items-start gap-2">
                             <PlusCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                             <div className="flex flex-col">
                               <span className="font-medium text-gray-700">Retroativo {results.details.refMonthName}</span>
                               <span className="text-xs text-gray-500">{results.details.workedDays} dias úteis</span>
                             </div>
                           </div>
                           <span className="font-bold text-green-600 whitespace-nowrap text-right">+ R$ {(results.details.workedDays * VR_VALUE).toFixed(2).replace('.', ',')}</span>
                         </div>

                         <div className="flex justify-between items-start">
                           <div className="flex items-start gap-2">
                             <PlusCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                             <div className="flex flex-col">
                               <span className="font-medium text-gray-700">Adiantamento {results.details.advanceMonthName}</span>
                               <span className="text-xs text-gray-500">22 dias úteis</span>
                             </div>
                           </div>
                           <span className="font-bold text-green-600 whitespace-nowrap text-right">+ R$ {(22 * VR_VALUE).toFixed(2).replace('.', ',')}</span>
                         </div>

                         {/* EXPLICAÇÃO DO RETROATIVO */}
                         <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100 leading-relaxed">
                           <strong>Entenda o Retroativo:</strong> No primeiro pagamento, você recebe o aux. alimentação dos dias do primeiro mês (que não foram pagos anteriormente) somados ao adiantamento de 22 dias úteis do mês seguinte.
                         </div>
                      </>
                    ) : (
                      <>
                         {/* Linha de Crédito */}
                         <div className="flex justify-between items-start">
                           <div className="flex items-start gap-2">
                             <PlusCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                             <div className="flex flex-col">
                               <span className="font-medium text-gray-700">Adiantamento {results.details.advanceMonthName}</span>
                               <span className="text-xs text-gray-500">22 dias úteis</span>
                             </div>
                           </div>
                           <span className="font-bold text-green-600 whitespace-nowrap text-right">+ R$ {results.details.vrCredit.toFixed(2).replace('.', ',')}</span>
                         </div>
                         
                         {/* Linha de Débito */}
                         <div className="flex justify-between items-start">
                           <div className="flex items-start gap-2">
                             <MinusCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                             <div className="flex flex-col">
                               <span className="font-medium text-gray-700">Ressarcimento</span>
                               <span className="text-xs text-gray-500">{results.details.vrDebitDays} dias úteis não trab. em {results.details.refMonthName}</span>
                             </div>
                           </div>
                           <span className="font-bold text-red-500 whitespace-nowrap text-right">- R$ {results.details.vrDebit.toFixed(2).replace('.', ',')}</span>
                         </div>

                         {/* EXPLICAÇÃO DO RESSARCIMENTO */}
                         <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2.5 rounded border border-gray-100 leading-relaxed">
                           <strong>Entenda o Ressarcimento:</strong> No mês passado, você recebeu adiantado 22 dias úteis de auxílio alimentação referente ao mês de {results.details.refMonthName}. Como você trabalhou apenas {results.details.workedDays} dias úteis em {results.details.refMonthName}, o excedente recebido está sendo ressarcido agora.
                         </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 3. Auxílio Transporte */}
                <div className="border border-slate-300 rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start group">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg group-hover:text-red-700 transition-colors uppercase">AUXÍLIO TRANSPORTE</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Referente a {results.details.vtDays} dias trabalhados presencialmente em {results.details.refMonthName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xl text-gray-800 block whitespace-nowrap">
                        = R$ {results.transport.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1 block">R$ {VT_VALUE.toFixed(2).replace('.', ',')}/dia presencial</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-4 bg-gradient-to-r from-red-50 to-red-100/50 p-6 rounded-2xl flex flex-col justify-start items-start border border-red-100 shadow-inner">
                  <span className="font-black text-red-800 uppercase text-lg tracking-wide mb-1">TOTAL LÍQUIDO A RECEBER</span>
                  
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-black text-4xl md:text-5xl text-red-600 leading-none drop-shadow-sm whitespace-nowrap tracking-tighter">
                      R$ {results.total.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-sm font-medium text-red-800/70 ml-2">Em {getPaymentDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Accordion Footer */}
        <div className="border-t border-gray-200">
          <button 
            onClick={() => setShowHolidaysList(!showHolidaysList)}
            className="w-full p-6 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-slate-700 font-bold text-sm focus:outline-none group"
          >
             <span className="flex items-center gap-3">
               <div className="bg-white p-2 rounded-lg border border-slate-200 group-hover:border-slate-300 transition-colors">
                 <FileText className="w-5 h-5 text-red-700" />
               </div>
               Calendário de Suspensão de Expediente (2025/2026)
             </span>
             {showHolidaysList ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          
          {showHolidaysList && (
            <div className="p-8 bg-white grid md:grid-cols-2 gap-10 border-t border-gray-200 animate-in slide-in-from-top-4">
               <div>
                  <h4 className="font-bold text-red-800 mb-4 text-sm border-b-2 border-red-100 pb-2 flex items-center gap-2">
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">2025</span> Ato GP nº 03/2025
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    {HOLIDAYS_2025_DETAILS.map((h, idx) => (
                      <li key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 hover:bg-slate-50 px-2 rounded transition-colors">
                        <span className="font-bold text-slate-700 font-mono text-xs bg-slate-100 px-2 py-1 rounded">{formatDate(h.date)}</span>
                        <span className="text-right">{h.name}</span>
                      </li>
                    ))}
                    <li className="flex justify-between items-center border-b border-slate-50 pb-2 px-2 rounded bg-red-50 text-red-700 font-medium mt-2">
                      <span className="font-bold font-mono text-xs bg-white/50 px-2 py-1 rounded">22/12 - 31/12</span>
                      <span>Recesso (Início)</span>
                    </li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-red-800 mb-4 text-sm border-b-2 border-red-100 pb-2 flex items-center gap-2">
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">2026</span> Ato GP nº 14/2025
                  </h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                     <li className="flex justify-between items-center border-b border-slate-50 pb-2 px-2 rounded bg-red-50 text-red-700 font-medium mb-2">
                      <span className="font-bold font-mono text-xs bg-white/50 px-2 py-1 rounded">01/01 - 09/01</span>
                      <span>Recesso (Fim)</span>
                    </li>
                    {HOLIDAYS_2026_DETAILS.map((h, idx) => (
                      <li key={idx} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 hover:bg-slate-50 px-2 rounded transition-colors">
                        <span className="font-bold text-slate-700 font-mono text-xs bg-slate-100 px-2 py-1 rounded">{formatDate(h.date)}</span>
                        <span className="text-right">{h.name}</span>
                      </li>
                    ))}
                     <li className="flex justify-between items-center border-b border-slate-50 pb-2 px-2 rounded bg-red-50 text-red-700 font-medium mt-2">
                      <span className="font-bold font-mono text-xs bg-white/50 px-2 py-1 rounded">21/12 - 31/12</span>
                      <span>Recesso (Início)</span>
                    </li>
                  </ul>
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
