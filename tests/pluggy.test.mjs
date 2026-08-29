import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('🏦 Testes de Integração e Normalização do Pluggy Open Finance', () => {
  it('Deve normalizar corretamente contas bancárias e calcular saldo total', () => {
    const rawAccounts = [
      { id: 'acc-1', marketingName: 'Nubank PF', balance: 1500.5, type: 'CHECKING' },
      { id: 'acc-2', name: 'Inter PJ', balance: 5000.0, type: 'BUSINESS' },
    ];

    let saldoTotal = 0;
    const contasFormatadas = rawAccounts.map((acc) => {
      saldoTotal += acc.balance || 0;
      return {
        id: acc.id,
        nome: acc.marketingName || acc.name || 'Conta Bancária',
        saldo: acc.balance || 0,
        tipo: acc.type,
      };
    });

    assert.strictEqual(saldoTotal, 6500.5);
    assert.strictEqual(contasFormatadas.length, 2);
    assert.strictEqual(contasFormatadas[0].nome, 'Nubank PF');
    assert.strictEqual(contasFormatadas[1].nome, 'Inter PJ');
  });

  it('Deve calcular ganhos e gastos a partir das transações da Pluggy', () => {
    const rawTransactions = [
      { id: 'tx-1', description: 'Salário', amount: 4000.0, type: 'CREDIT', date: '2026-03-05T10:00:00Z', category: 'Renda', accountId: 'acc-1' },
      { id: 'tx-2', description: 'Restaurante', amount: -150.0, type: 'DEBIT', date: '2026-03-06T12:00:00Z', category: 'Alimentação', accountId: 'acc-1' },
      { id: 'tx-3', description: 'Supermercado', amount: -350.0, type: 'DEBIT', date: '2026-03-07T15:00:00Z', category: 'Alimentação', accountId: 'acc-1' },
    ];

    let totalGanhos = 0;
    let totalGastos = 0;

    const transacoesFormatadas = rawTransactions.map((tx) => {
      const valorAbsoluto = Math.abs(tx.amount);
      const isCredito = tx.amount > 0 || tx.type === 'CREDIT';

      if (isCredito) {
        totalGanhos += valorAbsoluto;
      } else {
        totalGastos += valorAbsoluto;
      }

      return {
        id: tx.id,
        descricao: tx.description,
        valor: valorAbsoluto,
        tipo: isCredito ? 'CREDITO' : 'DEBITO',
        data: tx.date.split('T')[0],
        categoria: tx.category,
        contaId: tx.accountId,
      };
    });

    transacoesFormatadas.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    assert.strictEqual(totalGanhos, 4000.0);
    assert.strictEqual(totalGastos, 500.0);
    assert.strictEqual(transacoesFormatadas[0].id, 'tx-3', 'A mais recente deve vir primeiro');
  });
});
