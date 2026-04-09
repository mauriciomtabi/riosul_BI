const veiculosBase = [
  { id: 20, nome: "CAMINHÃO 4X2 DELIVERY (CÓD. 20)", categoria: "Caminhões" },
  { id: 6, nome: "CAMINHÃO PIPA FORD 12000 (CÓD. 6)", categoria: "Caminhões" },
  { id: 21, nome: "CAMINHÃO SCANIA 112 (CÓD. 21)", categoria: "Caminhões" },
  { id: 36, nome: "CAMINHÃO TÉRMICO FORD (CÓD. 36)", categoria: "Caminhões" },
  { id: 70, nome: "CAMINHÃO MB 708/E (CÓD. 70)", categoria: "Caminhões" },
  { id: 90, nome: "TECTOR 240E25 - 6X2", categoria: "Caminhões" },
  { id: 91, nome: "TECTOR 170E22 - 6X2", categoria: "Caminhões" },
  { id: 100, nome: "VEÍCULOS DIRETORIA", categoria: "Administração Local" },
  { id: 101, nome: "S10 APOIO", categoria: "Administração Local" },
  { id: 200, nome: "GOL COMERCIAL", categoria: "Veículos de Passeio" },
  { id: 201, nome: "UNO SERVIÇOS", categoria: "Veículos de Passeio" }
];

const anos = [2024, 2025, 2026];
const meses = [1,2,3,4,5,6,7,8,9,10,11,12];

const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function getSimulatedData() {
  const dataset = [];
  
  anos.forEach(ano => {
    // Para 2026, vamos gerar apenas até Janeiro conforme a especificação do usuário
    const limiteEspecialMeses = (ano === 2026) ? [1] : meses;

    limiteEspecialMeses.forEach(mes => {
      // Determinar trimestre
      const trimestre = Math.ceil(mes / 3);

      veiculosBase.forEach(v => {
        // Gera valores baseados na categoria pra simular o DRE (Caminhões ganham mais, mas gastam mais)
        let baseFat = 0;
        let baseDesp = 0;

        if (v.categoria === 'Caminhões') {
          baseFat = rng(30000, 150000);
          baseDesp = rng(20000, 110000);
        } else if (v.categoria === 'Veículos de Passeio') {
          baseFat = rng(5000, 20000);
          baseDesp = rng(3000, 15000);
        } else {
          // Adm Local geralmente só tem despesa no DRE
          baseFat = rng(0, 5000);
          baseDesp = rng(10000, 50000);
        }

        // Previsto
        const prevFat = baseFat * (rng(80, 120) / 100);
        const prevDesp = baseDesp * (rng(80, 120) / 100);

        dataset.push({
          id: `${ano}-${mes}-${v.id}`,
          ano: ano.toString(),
          mes: mes.toString(),
          trimestre: `T${trimestre}`,
          veiculoId: v.id,
          veiculoNome: v.nome,
          categoria: v.categoria,
          faturamentoRealizado: baseFat,
          faturamentoPrevisto: prevFat,
          despesaRealizada: baseDesp,
          despesaPrevista: prevDesp
        });
      });
    });
  });

  return dataset;
}

export const rawDataset = getSimulatedData();
