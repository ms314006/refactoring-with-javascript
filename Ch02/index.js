/*
const statement = (invoice, plays) => {
  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => {
    let result = 0;
    switch (playFor(perf).type) {
      case 'tragedy':
        result = 40000;
        if (perf.audience > 30) {
          result += 1000 * (perf.audience - 30);
        }
        break;
      case 'comedy':
        result = 30000;
        if (perf.audience > 20) {
          result += 10000 + 500 * (perf.audience - 20);
        }
        result += 300 * perf.audience;
        break;
      default:
        throw new Error(`unknown type: ${playFor(perf).type}`);
    }
    return result;
  };

  const usd = (aNumber) => {
    return new Intl.NumberFormat('en-US',
      { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format(aNumber / 100);
  };

  const totalVolumeCredits = () => {
    let result = 0;
    for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
      const perf = invoice.performances[i];

      result += Math.max(perf.audience - 30, 0);

      if (playFor(perf).type === 'comedy') {
        result += Math.floor(perf.audience / 5);
      }
    }
    return result;
  };

  const totalAmount = () => {
    let result = 0;
    for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
      const perf = invoice.performances[i];
      result += amountFor(perf);
    }
    return result;
  };

  let result = `Statement for ${invoice.customer}\n`;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
};
*/

const usd = aNumber => (new Intl.NumberFormat('en-US',
  { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format(aNumber / 100)
);

const createStatementData = (invoice, plays) => {
  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => {
    let result = 0;
    switch (perf.play.type) {
      case 'tragedy':
        result = 40000;
        if (perf.audience > 30) {
          result += 1000 * (perf.audience - 30);
        }
        break;
      case 'comedy':
        result = 30000;
        if (perf.audience > 20) {
          result += 10000 + 500 * (perf.audience - 20);
        }
        result += 300 * perf.audience;
        break;
      default:
        throw new Error(`unknown type: ${perf.play.type}`);
    }
    return result;
  };

  const totalAmount = data => (data.performances
    .reduce((total, p) => total + amountFor(p), 0)
  );

  const volumeCreditsFor = (perf) => {
    let result = 0;
    result += Math.max(perf.audience - 30, 0);

    if (perf.play.type === 'comedy') {
      result += Math.floor(perf.audience / 5);
    }

    return result;
  };

  const totalVolumeCredits = data => (data.performances
    .reduce((total, p) => total + volumeCreditsFor(p), 0)
  );

  const enrichPerformances = ((aPerformances) => {
    const data = { ...aPerformances, };
    data.play = playFor(aPerformances);
    data.amount = amountFor(data);
    data.volumeCredits = volumeCreditsFor(data);
    return data;
  });

  const statementData = {
    customer: invoice.customer,
    performances: invoice.performances.map(enrichPerformances),
  };

  statementData.totalAmount = totalAmount(statementData);
  statementData.totalVolumeCredits = totalVolumeCredits(statementData);

  return statementData;
};

const renderText = (data) => {
  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= data.performances.length - 1; i += 1) {
    const perf = data.performances[i];
    result += `  ${perf.play.name}: ${usd(perf.amount)} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(data.totalAmount)}\n`;
  result += `You earned ${data.totalVolumeCredits} credits\n`;
  return result;
};

/*
const renderHtml = (data) => {  };
*/

const statement = (invoice, plays) => renderText(createStatementData(invoice, plays));

/*
const statementHtml = (invoice, plays) => renderHtml(createStatementData(invoice, plays));
*/

const plays = {
  hamlet: { name: 'Hamlet', type: 'tragedy', },
  'as-like': { name: 'As You Like It', type: 'comedy', },
  othello: { name: 'Othello', type: 'tragedy', },
};

const invoices = {
  customer: 'BigCo',
  performances: [
    {
      playID: 'hamlet',
      audience: 55,
    },
    {
      playID: 'as-like',
      audience: 35,
    },
    {
      playID: 'othello',
      audience: 40,
    },
  ],
};

console.log(statement(invoices, plays));
