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
