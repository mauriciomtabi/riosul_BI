// ================================================================
// RIOSUL BI — Google Apps Script para Rastreamento de Convidados
// Planilha: https://docs.google.com/spreadsheets/d/1WKVc0-_AYW8iRAXiGRLD_81wcBNQlRXyJaogLm2FIgk
// ================================================================

const SHEET_ID = '1WKVc0-_AYW8iRAXiGRLD_81wcBNQlRXyJaogLm2FIgk';

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

    // Cria cabeçalhos se a planilha estiver vazia
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Data/Hora', 'Nome', 'Email', 'Empresa', 'Dispositivo', 'Sistema']);
      sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#10b981').setFontColor('#ffffff');
    }

    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
      data.nome || '—',
      data.email || '—',
      data.empresa || '—',
      data.dispositivo || '—',
      data.sistema || '—'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste manual pela IDE do Google Apps Script
function testeManual() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
  sheet.appendRow([
    new Date().toLocaleString('pt-BR'),
    'Teste Manual', 'teste@riosul.com.br', 'Riosul', 'Desktop Chrome', 'Windows 10'
  ]);
  Logger.log('Linha inserida com sucesso!');
}
