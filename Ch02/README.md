## 增加功能 - statement
經過上一章，擁有了結構的 `statement` 會變成這樣：
```javascript
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

  const volumeCreditsFor = (aPerformance) => {
    let result = 0;
    result += Math.max(aPerformance.audience - 30, 0);
    if (playFor(aPerformance).type === 'comedy') {
      result += Math.floor(aPerformance.audience / 5);
    }
    return result;
  }

  const totalVolumeCredits = () => {
    let result = 0;
    for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
      const perf = invoice.performances[i];
      result += volumeCreditsFor(perf);
    }
    return result;
  }

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
```
`statement` 比重構前的程式碼還要多行，但主要執行的程式只剩下 6 行，幾乎都是打印 Text 的部分，其他的邏輯都分別放到小函式中了，也因為如此，當我們要繼續增加功能時，也更容易找到要修改的部分，甚至可以不用理會處理其餘邏輯的函式。

接下來要為 `statement` 的結果分成 render 純文字版本及 html 版本，第一步用 [Split Phase](https://memberservices.informit.com/my_account/webedition/9780135425664/html/splitphase.html) 將目前 render Text 版本的程式碼提出來，變成另一個 method：
```javascript
const statement = (invoice, plays) => {
  return renderPlainText(invoice, plays);
};

const renderPlainText = (invoice, plays) => {
  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const usd = (aNumber) => { /*...*/ };

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const totalVolumeCredits = () => { /*...*/ };

  const totalAmount = () => { /*...*/ };

  let result = `Statement for ${invoice.customer}\n`;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
}
```
接著在 `statement` 中建立一個 `statementData` 物件，用來傳遞資料給 `renderPlainText` 做處理：
```javascript
const statement = (invoice, plays) => {
  const statementData = {
    customer: invoice.customer,
  };
  return renderPlainText(statementData, invoice, plays);
};

const renderPlainText = (data, invoice, plays) => { /*...*/ }
```
既然加上了 `customer` 在 `statementData` 中，那就可以將 `renderPlainText` 裡面的 `invoice.customer` 都換成 `data.customer` ：
```javascript
const statement = (invoice, plays) => {
  const statementData = {
    customer: invoice.customer,
  };
  return renderPlainText(statementData, invoice, plays);
};

const renderPlainText = (data, invoice, plays) => {
  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const usd = (aNumber) => { /*...*/ };

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const totalVolumeCredits = () => { /*...*/ };

  const totalAmount = () => { /*...*/ };

  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
}
```
`customer` 的另一個 `performances` 也要做相同的處理，但切記來源的資料不可異動，因此利用 `map` 產生另一個新的陣列，這裡完成後直接取代 `renderPlainText` 內使用 `performances` 的地方：
```javascript
const statement = (invoice, plays) => {
  const enrichPerformance = (aPerformances) => ({
      ...aPerformances,
  });

  const statementData = {
    customer: invoice.customer,
    performances: invoice.performances.map(enrichPerformance);
  }
  return renderPlainText(statementData, invoice, plays);
};

const renderPlainText = (data, invoice, plays) => {
  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const usd = (aNumber) => { /*...*/ };

  const volumeCreditsFor = (aPerformance) => {
    let result = 0;
    result += Math.max(aPerformance.audience - 30, 0);
    if (playFor(aPerformance).type === 'comedy') {
      result += Math.floor(aPerformance.audience / 5);
    }
    return result;
  }

  const totalVolumeCredits = () => {
    let result = 0;
    for (let i = 0; i <= data.performances.length - 1; i += 1) {
      const perf = data.performances[i];
      result += volumeCreditsFor(perf);
    }
    return result;
  }

  const totalAmount = () => {
    let result = 0;
    for (let i = 0; i <= data.performances.length - 1; i += 1) {
      const perf = data.performances[i];
      result += amountFor(perf);
    }
    return result;
  };

  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= data.performances.length - 1; i += 1) {
    const perf = data.performances[i];
    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
}
```
最後一個參數是 `plays` ，他的值在 `renderPlainText` 的迴圈中產生，這裡可以直接將他移到 `statement` 的 `enrichPerformance` 內直接在 `map` 內產生 `plays` ，並一起放在 `data` 中給 `renderPlainText` 處理，但是取得 `play` 的 method 在 `renderPlainText` 中，這時候用 [Move Function](https://memberservices.informit.com/my_account/webedition/9780135425664/html/movefunction.html)，把 `playFor` 提到需要他的地方，也就是 `statement` 之後記得在取代 `renderPlainText` 中用到 `playFor()` 的部分，完成後便可刪除 `renderPlainText` 的 `invoice` 和 `plays` ，全都由 `statementData` 給予資料：
```javascript
const statement = (invoice, plays) => {

  const playFor = perf => plays[perf.playID];

  const enrichPerformance = (aPerformances) => ({
      ...aPerformances,
      play: playFor(aPerformances),
  });

  const statementData = {
    customer: invoice.customer,
    performances: invoice.performances.map(enrichPerformance);
  }
  return renderPlainText(statementData);
};

const renderPlainText = (data) => {
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

  const usd = (aNumber) => { /*...*/ };

  const totalVolumeCredits = () => {
    let result = 0;
    for (let i = 0; i <= data.performances.length - 1; i += 1) {
      const perf = data.performances[i];
      result += volumeCreditsFor(perf);
    }
    return result;
  }

  const totalAmount = () => {
    let result = 0;
    for (let i = 0; i <= data.performances.length - 1; i += 1) {
      const perf = data.performances[i];
      result += amountFor(perf);
    }
    return result;
  };

  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= data.performances.length - 1; i += 1) {
    const perf = data.performances[i];
    result += `  ${perf.play.name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
}
```
然後 `amoutFor` 和 `volumeCreditsFor` 也用類似的方式移動：
```javascript
const statement = (invoice, plays) => {

  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const enrichPerformance = (aPerformances) => ({
      ...aPerformances,
      play: playFor(aPerformances),
      amount: amountFor(aPerformances),
      volumeCredits: volumeCreditsFor(aPerformances),
  });

  const statementData = {
    customer: invoice.customer,
    performances: invoice.performances.map(enrichPerformance);
  }
  return renderPlainText(statementData);
};

const renderPlainText = (data) => {

  const usd = (aNumber) => { /*...*/ };

  const totalVolumeCredits = () => {
    let result = 0;
    for (let i = 0; i <= data.performances.length - 1; i += 1) {
      const perf = data.performances[i];
      result += perf.volumeCredits;
    }
    return result;
  }

  const totalAmount = () => {
    let result = 0;
    for (let i = 0; i <= data.performances.length - 1; i += 1) {
      const perf = data.performances[i];
      result += perf.amount;
    }
    return result;
  };

  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= data.performances.length - 1; i += 1) {
    const perf = data.performances[i];
    result += `  ${perf.play.name}: ${usd(perf.amount)} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
}
```
再來是 `totalVolumeCredits` 和 `totalAmount`：
```javascript
const statement = (invoice, plays) => {

  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const totalVolumeCredits = (data) => { /*...*/ };

  const totalAmount = (data) => { /*...*/ };

  const enrichPerformance = (aPerformances) => ({
      ...aPerformances,
      play: playFor(aPerformances),
      amount: amountFor(aPerformances),
      volumeCredits: volumeCreditsFor(aPerformances),
  });

  const statementData = {
    customer: invoice.customer,
    performances: invoice.performances.map(enrichPerformance);
  }

  statementData.totalVolumeCredits = totalVolumeCredits(statementData);
  statementData.totalAmount = totalAmount(statementData);

  return renderPlainText(statementData);
};

const renderPlainText = (data) => {

  const usd = (aNumber) => { /*...*/ };

  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= data.performances.length - 1; i += 1) {
    const perf = data.performances[i];
    result += `  ${perf.play.name}: ${usd(perf.amount)} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(data.totalAmount)}\n`;
  result += `You earned ${data.totalVolumeCredits} credits\n`;
  return result;
}
```
接著在 `totalVolumeCredits` 和 `totalAmount` 內部都可以利用 [Replace Loop with Pipeline](https://memberservices.informit.com/my_account/webedition/9780135425664/html/replaceloopwithpipeline.html) 來處理迴圈計算值的部分：
```javascript
const totalAmount = () => (
  invoice.performances.reduce((total, perf) => total + amountFor(perf), 0)
);

const totalVolumeCredits = () => (
  invoice.performances.reduce((total, perf) => total + volumeCreditsFor(perf), 0)
);
```
最後將所有產生 `statementData` 物件的程式碼都提出來另外包一個 Method
```javascript
const createStatementData = (invoice, plays) => {
  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const totalVolumeCredits = (data) => { /*...*/ };

  const totalAmount = (data) => { /*...*/ };

  const enrichPerformance = (aPerformances) => ({
      ...aPerformances,
      play: playFor(aPerformances),
      amount: amountFor(aPerformances),
      volumeCredits: volumeCreditsFor(aPerformances),
  });

  const statementData = {
    customer: invoice.customer,
    performances: invoice.performances.map(enrichPerformance);
  }

  statementData.totalVolumeCredits = totalVolumeCredits(statementData);
  statementData.totalAmount = totalAmount(statementData);
  return statementData;
}

const statement = (invoice, plays) => {
  return renderPlainText(createStatementData(invoice, plays));
};

const renderPlainText = (data) => {

  const usd = (aNumber) => { /*...*/ };

  let result = `Statement for ${data.customer}\n`;

  for (let i = 0; i <= data.performances.length - 1; i += 1) {
    const perf = data.performances[i];
    result += `  ${perf.play.name}: ${usd(perf.amount)} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(data.totalAmount)}\n`;
  result += `You earned ${data.totalVolumeCredits} credits\n`;
  return result;
}
```
重構至此，要編寫另一個 html 的版本已經不是難事了，這裡將 `usd` 移到最外層，讓 Text 或 Html 版本都可以使用它：
```javascript
const usd = (aNumber) => { /*...*/ };

const createStatementData = (invoice, plays) => { /*...*/ }

const statement = (invoice, plays) => { /*...*/ };

const renderPlainText = (data) => { /*...*/ }

const htmlStatement = (invoice, plays) => { /*...*/ };

const renderPlainHtml = (data) => { /*...*/ }
```

### 總心得
1. Brevity is the soul of wit, but clarity is the soul of evolvable software.