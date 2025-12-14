import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, CalendarDays, Info, ArrowLeft, CalendarClock, MinusCircle, PlusCircle, AlertTriangle, ChevronDown, ChevronUp, FileText, HelpCircle, MapPin, User, Code } from 'lucide-react';

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
      bolsaDesc = `Prop. ao mês de ${MONTH_NAMES[refM]} (${daysConsidered}/30 dias) - Faltas`;
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Header - SIMPLIFICADO */}
        <div className="bg-gradient-to-br from-red-900 to-red-800 p-6 text-white flex flex-col items-center justify-center gap-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold flex flex-col md:flex-row items-center gap-2">
            <Calculator className="w-8 h-8" />
            Calculadora de Salário - Estágio TCE-SP
          </h1>
        </div>

        {/* ABA EXPLICATIVA (HELP) REFORMULADA */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 p-6 flex flex-col md:flex-row items-start gap-4">
            <div className="bg-indigo-100 p-2 rounded-full shrink-0">
                <HelpCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="text-sm text-indigo-900 leading-relaxed">
              <h3 className="font-bold text-lg text-indigo-800 mb-2">Como funciona?</h3>
              <p className="text-indigo-800/80">
                Esta calculadora estima o valor do pagamento que será recebido no dia 15 do mês selecionado. 
                <br></br> <strong>Exemplo:</strong> Ao selecionar Janeiro de 2026, você saberá quanto receberá em 15 de janeiro de 2026, que será o pagamento referente
                ao mês trabalhado de Dezembro.  
              </p>
            </div>
        </div>

        {/* Developer Credit - REPOSICIONADO */}
        <div className="bg-slate-50 px-6 py-2 border-b border-gray-200 text-center">
          <span className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <Code className="w-3 h-3" /> Desenvolvido por <strong className="text-slate-700">Gabriel Zaneta Pinheiro - UR-2.5 Bauru-SP</strong>
          </span>
        </div>

        <div className="p-6 md:p-8 grid gap-8 md:grid-cols-2">
          
          {/* Coluna Esquerda: Inputs */}
          <div className="space-y-6">
            
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                1. Selecione o mês e o ano do pagamento
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="col-span-2">
                  <div className="flex gap-2">
                    <select 
                      value={payMonth} 
                      onChange={(e) => setPayMonth(parseInt(e.target.value))}
                      className="w-full rounded-lg border-gray-300 p-2.5 focus:border-red-500 focus:ring-red-500 bg-white"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx}>{m}</option>
                      ))}
                    </select>
                    
                    {/* Alterado para SELECT (Ano) */}
                    <select
                      value={payYear} 
                      onChange={(e) => setPayYear(parseInt(e.target.value))}
                      className="w-32 rounded-lg border-gray-300 p-2.5 text-center font-bold bg-white focus:border-red-500 focus:ring-red-500"
                    >
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                  <label className="text-sm font-semibold text-gray-600 block mb-2">
                    Faltas Injustificadas em <span className="text-red-600 underline decoration-red-200">{getRefMonthName()}</span>
                  </label>
                  
                  {/* Alterado para SELECT (Faltas) */}
                  <select 
                    value={absences} 
                    onChange={(e) => setAbsences(parseInt(e.target.value))}
                    className="w-full rounded-lg border-gray-300 p-2.5 focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  
                  {/* NOTA DESTAQUE SOBRE FALTAS */}
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 relative overflow-hidden">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-900 leading-relaxed">
                        <strong className="block text-amber-700 mb-1">Cálculo de faltas em desenvolvimento</strong>
                        Ainda não tenho a regra oficial de desconto por faltas. Caso tenha faltas injustificadas, por favor contate <strong>Gabriel Zaneta Pinheiro</strong> via Teams.
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
                  <label className="text-sm font-semibold text-gray-600 block mb-2">
                    Dias Extras Sem Expediente em <span className="text-red-600 underline decoration-red-200">{getRefMonthName()}</span>
                  </label>
                  
                  {/* Alterado para SELECT (Dias Extras) */}
                  <select 
                    value={extraHolidays} 
                    onChange={(e) => setExtraHolidays(parseInt(e.target.value))}
                    className="w-full rounded-lg border-gray-300 p-2.5 focus:ring-red-500 bg-gray-50 focus:bg-white transition-colors"
                  >
                    {DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  
                  <div className="mt-3 flex gap-3 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                    <p>
                        Informe a quantidade de dias sem expediente no mês de referência que <strong>não constam no calendário oficial</strong> (ex: feriados municipais ou suspensões locais não listadas abaixo).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 shadow-sm">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input 
                  type="checkbox" 
                  checked={isFirstMonth}
                  onChange={() => setIsFirstMonth(!isFirstMonth)}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                />
                <span className="font-bold text-gray-800">Selecione se é seu primeiro pagamento</span>
              </label>

              {isFirstMonth && (
                <div className="animate-in fade-in slide-in-from-top-2 pt-2 border-t border-orange-200 mt-2">
                  <p className="text-sm text-gray-600 mb-2 font-medium">
                    Dia que você começou em {getRefMonthName()}.
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar p-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <button
                        key={day}
                        onClick={() => setStartDay(day)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          startDay === day 
                            ? 'bg-orange-600 text-white shadow-lg scale-105' 
                            : 'bg-white border border-gray-200 text-gray-500 hover:bg-orange-100'
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

          {/* Coluna Direita: Resultados */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden relative flex flex-col">
              
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" /> Demonstrativo Financeiro
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold uppercase tracking-wider">Estimativa</span>
              </div>
              
              <div className="p-6 space-y-6 relative z-10 grow">
                {/* Bolsa */}
                <div className="flex justify-between items-start group">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Bolsa-Auxílio</h4>
                    {results.details.bolsaFormula && (
                      <p className="text-xs text-gray-500 mt-1">{results.details.bolsaFormula}</p>
                    )}
                  </div>
                  <span className="font-bold text-lg text-gray-800">
                    R$ {results.bolsa.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <div className="h-px bg-gray-100"></div>

                {/* VR - Detalhado */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col mb-1">
                      <h4 className="font-bold text-gray-800 text-lg">Auxílio Alimentação</h4>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">R$ {VR_VALUE}/dia</span>
                    </div>
                    <span className="font-bold text-lg text-gray-800">
                      R$ {results.vrTotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  {isFirstMonth ? (
                    <div className="bg-orange-50 p-4 rounded-lg text-sm text-gray-600 space-y-2 border border-orange-100">
                      <div className="flex justify-between">
                        <span>Prop. {results.details.refMonthName} ({results.details.workedDays} dias)</span>
                        <span className="font-medium text-orange-700">+ R$ {(results.details.workedDays * VR_VALUE).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Adiant. {results.details.advanceMonthName} (22 dias de auxílio alimentação)</span>
                        <span className="font-medium text-orange-700">+ R$ {(22 * VR_VALUE).toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2 border border-gray-100">
                       {/* Linha de Crédito */}
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <PlusCircle className="w-4 h-4 text-green-500" />
                           <span>Adiantamento de {results.details.advanceMonthName} (22 dias de auxílio alimentação)</span>
                         </div>
                         <span className="font-medium text-green-600">+ R$ {results.details.vrCredit.toFixed(2)}</span>
                       </div>
                       
                       {/* Linha de Débito */}
                       <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-2 mt-1">
                         <div className="flex items-center gap-2">
                           <MinusCircle className="w-4 h-4 text-red-400" />
                           <span>Ressarcimento</span>
                         </div>
                         <span className="font-medium text-red-500">- R$ {results.details.vrDebit.toFixed(2)}</span>
                       </div>

                       {/* EXPLICAÇÃO DO RESSARCIMENTO */}
                       <div className="mt-2 text-xs text-gray-500 bg-white p-2.5 rounded border border-gray-200 leading-relaxed shadow-sm">
                         <strong>Entenda o Ressarcimento:</strong> No mês passado, você recebeu 22 dias de auxílio alimentação adiantados. Como você trabalhou apenas {results.details.workedDays} dias em {results.details.refMonthName}, o valor correspondente aos dias não trabalhados está sendo descontado agora.
                       </div>
                      
                    </div>
                  )}
                </div>

                <div className="h-px bg-gray-100"></div>

                {/* VT */}
                <div className="flex justify-between items-start group">
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg">Auxílio Transporte</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      Referente a {results.details.vtDays} dias trabalhados em {results.details.refMonthName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-gray-800 block">
                      R$ {results.transport.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1 block">R$ {VT_VALUE}/dia</span>
                  </div>
                </div>

                {/* Total */}
                <div className="mt-8 bg-gradient-to-r from-red-50 to-red-100/50 p-6 rounded-2xl flex flex-col justify-between items-center border border-red-100 shadow-inner">
                  <span className="font-bold text-red-800 uppercase text-xs tracking-wider mb-2">Total Líquido a Receber</span>
                  
                  <div className="text-center mb-3">
                    <span className="text-2xl md:text-3xl font-bold text-red-900 block">Em {getPaymentDateString()}</span>
                  </div>

                  <span className="font-black text-5xl text-red-600 leading-none drop-shadow-sm">
                    R$ {results.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
              <Info className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Nota:</strong> O cálculo utiliza os dias úteis, faltas e feriados de <strong>{getRefMonthName()}</strong> para definir os valores que serão pagos em <strong>{MONTH_NAMES[payMonth]}</strong>.
              </p>
            </div>
          </div>
        </div>
        
        {/* Accordion Footer */}
        <div className="border-t border-gray-200">
          <button 
            onClick={() => setShowHolidaysList(!showHolidaysList)}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between text-gray-700 font-medium text-sm focus:outline-none"
          >
             <span className="flex items-center gap-2">
               <FileText className="w-4 h-4" />
               Calendário de Suspensão de Expediente (2025/2026)
             </span>
             {showHolidaysList ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showHolidaysList && (
            <div className="p-6 bg-gray-50 grid md:grid-cols-2 gap-8 border-t border-gray-200 animate-in slide-in-from-top-2">
               <div>
                  <h4 className="font-bold text-red-800 mb-3 text-sm border-b border-red-200 pb-2">2025 - Ato GP nº 03/2025</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {HOLIDAYS_2025_DETAILS.map((h, idx) => (
                      <li key={idx} className="flex justify-between border-b border-gray-200/50 pb-1 last:border-0">
                        <span className="font-medium">{formatDate(h.date)}</span>
                        <span>{h.name}</span>
                      </li>
                    ))}
                    <li className="flex justify-between border-b border-gray-200/50 pb-1 text-red-600 italic">
                      <span className="font-medium">22/12 a 31/12</span>
                      <span>Recesso (Início)</span>
                    </li>
                  </ul>
               </div>

               <div>
                  <h4 className="font-bold text-red-800 mb-3 text-sm border-b border-red-200 pb-2">2026 - Ato GP nº 14/2025</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                     <li className="flex justify-between border-b border-gray-200/50 pb-1 text-red-600 italic">
                      <span className="font-medium">01/01 a 09/01</span>
                      <span>Recesso (Fim)</span>
                    </li>
                    {HOLIDAYS_2026_DETAILS.map((h, idx) => (
                      <li key={idx} className="flex justify-between border-b border-gray-200/50 pb-1 last:border-0">
                        <span className="font-medium">{formatDate(h.date)}</span>
                        <span>{h.name}</span>
                      </li>
                    ))}
                     <li className="flex justify-between border-b border-gray-200/50 pb-1 text-red-600 italic">
                      <span className="font-medium">21/12 a 31/12</span>
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