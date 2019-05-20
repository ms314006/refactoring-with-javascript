## 範例一 - statement

```javascript
const statement = (invoice, plays) => {
  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    const play = plays[perf.playID];
    let thisAmount = 0;

    switch (play.type) {
      case 'tragedy':
        thisAmount = 40000;
        if (perf.audience > 30) {
          thisAmount += 1000 * (perf.audience - 30);
        }
        break;
      case 'comedy':
        thisAmount = 30000;
        if (perf.audience > 20) {
          thisAmount += 10000 + 500 * (perf.audience - 20);
        }
        thisAmount += 300 * perf.audience;
        break;
      default:
        throw new Error(`unknown type: ${play.type}`);
    }

    volumeCredits += Math.max(perf.audience - 30, 0);

    if (play.type === 'comedy') {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    result += `  ${play.name}: ${formatUSD(thisAmount / 100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
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

statement(invoices, plays);
/* result
Statement for BigCo
  Hamlet: $650.00 (55 seats)
  As You Like It: $580.00 (35 seats)
  Othello: $500.00 (40 seats)
Amount owed is $1,730.00
You earned 47 credits
*/
```

### 分解功能
#### 將 `switch` 抽離
這裡使用 [Extract Function](https://memberservices.informit.com/my_account/webedition/9780135425664/html/extractfunction.html) 的技巧，將 `switch` 的部分抽離。
```javascript
const statement = (invoice, plays) => {

  const amountFor = (perf, play) => {
    let thisAmount = 0;
    switch (play.type) {
    case "tragedy":
      thisAmount = 40000;
      if (perf.audience > 30) {
        thisAmount += 1000 * (perf.audience - 30);
      }
      break;
    case "comedy":
      thisAmount = 30000;
      if (perf.audience > 20) {
        thisAmount += 10000 + 500 * (perf.audience - 20);
      }
      thisAmount += 300 * perf.audience;
      break;
    default:
        throw new Error(`unknown type: ${play.type}`);
    }
    return thisAmount;
  }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    const play = plays[perf.playID];
    let thisAmount = amountFor(perf, play);

    volumeCredits += Math.max(perf.audience - 30, 0);

    if (play.type === 'comedy') {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    result += `  ${play.name}: ${formatUSD(thisAmount / 100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
};
```
當重構一些部分，就得做一次測試，確保程式沒有在這一次的重構發生錯誤。

##### 重新命名 `amountFor` 內的變數
重新命名 [Extract Function](https://memberservices.informit.com/my_account/webedition/9780135425664/html/extractfunction.html) 內的變數會使內容更清楚，將 `totalAmount` 換成 `result` ，因為 `totalAmount` 這個變數名稱在 `amountFor` 內一點意義都沒有。
```javascript
const amountFor = (perf, play) => {
  let result = 0;
  switch (play.type) {
  case "tragedy":
    result = 40000;
    if (perf.audience > 30) {
      result += 1000 * (perf.audience - 30);
    }
    break;
  case "comedy":
    result = 30000;
    if (perf.audience > 20) {
      result += 10000 + 500 * (perf.audience - 20);
    }
    result += 300 * perf.audience;
    break;
  default:
      throw new Error(`unknown type: ${play.type}`);
  }
  return result;
}
```

#### 刪除變數 `play`
這裡使用 [Replace Temp with Query](https://memberservices.informit.com/my_account/webedition/9780135425664/html/replacetempwithquery.html) 處理變數 `play` 。
```javascript
const statement = (invoice, plays) => {

  const amountFor = (perf, play) => { /*...*/ }

  const playFor = (aPerformance) => {
    return plays[aPerformance.playID];
  }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    const play = playFor(perf);
    let thisAmount = amountFor(perf, play);

    volumeCredits += Math.max(perf.audience - 30, 0);

    if (play.type === 'comedy') {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    result += `  ${play.name}: ${formatUSD(thisAmount / 100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
};
```
接著 combo [Inline Variable](https://memberservices.informit.com/my_account/webedition/9780135425664/html/inlinevariable.html)，把所有的變數 `play` 都直接取代成 `playFor()` ，並且刪除變數 `play` 。
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    let thisAmount = amountFor(perf, playFor(perf));

    volumeCredits += Math.max(perf.audience - 30, 0);

    if (playFor(perf).type === 'comedy') {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    result += `  ${playFor(perf).name}: ${formatUSD(thisAmount / 100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
};
```
確認沒問題後，負責處理 `switch` 的 `amountFor` 內也不需再傳入 `play` 了，直接以 `playFor` 代替。
```javascript
const amountFor = (perf) => {
  let result = 0;
  switch (playFor(perf).type) {
  case "tragedy":
    result = 40000;
    if (perf.audience > 30) {
      result += 1000 * (perf.audience - 30);
    }
    break;
  case "comedy":
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
}
```
移除呼叫 `amountFor` 時傳入的 `playFor()` 。
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    let thisAmount = amountFor(perf);

    volumeCredits += Math.max(perf.audience - 30, 0);

    if (playFor(perf).type === 'comedy') {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    result += `  ${playFor(perf).name}: ${formatUSD(thisAmount / 100)} (${perf.audience} seats)\n`;
    totalAmount += thisAmount;
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
```
> 將取得 paly 的部分使用 [Replace Temp with Query](https://memberservices.informit.com/my_account/webedition/9780135425664/html/replacetempwithquery.html) 搭配 [Inline Variable](https://memberservices.informit.com/my_account/webedition/9780135425664/html/inlinevariable.html) 寫後，每一次迴圈的執行 `plays[aPerformance.playID]` 的次數從一變成三。

#### thisAmount 也透過 [Inline Variable](https://memberservices.informit.com/my_account/webedition/9780135425664/html/inlinevariable.html) 方式修改
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];

    volumeCredits += Math.max(perf.audience - 30, 0);

    if (playFor(perf).type === 'comedy') {
      volumeCredits += Math.floor(perf.audience / 5);
    }

    result += `  ${playFor(perf).name}: ${formatUSD(amountFor(perf) / 100)} (${perf.audience} seats)\n`;
    totalAmount += amountFor(perf);
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
```

#### 抽出計算 volumeCredits 的邏輯
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  const volumeCreditsFor = (aPerformance) => {
    let result = 0;
    result += Math.max(aPerformance.audience - 30, 0);

    if (playFor(aPerformance).type === 'comedy') {
      result += Math.floor(aPerformance.audience / 5);
    }

    return result;
  }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;
  const formatUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, }).format;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];

    volumeCredits += volumeCreditsFor(perf);

    result += `  ${playFor(perf).name}: ${formatUSD(amountFor(perf) / 100)} (${perf.audience} seats)\n`;
    totalAmount += amountFor(perf);
  }
  result += `Amount owed is ${formatUSD(totalAmount / 100)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
```
#### 對 formatUSD 使用 [Replace Temp with Query](https://memberservices.informit.com/my_account/webedition/9780135425664/html/replacetempwithquery.html)
記得要刪掉原本的 temp 變數
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const usd = (aNumber) => {
    return new Intl.NumberFormat('en-US',{
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(aNumber/100)
  }

  let totalAmount = 0;
  let volumeCredits = 0;
  let result = `Statement for ${invoice.customer}\n`;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];

    volumeCredits += volumeCreditsFor(perf);

    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
    totalAmount += amountFor(perf);
  }
  result += `Amount owed is ${usd(totalAmount)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
```

#### 處理 `for` 迴圈
這裡利用 [Split Loop](https://memberservices.informit.com/my_account/webedition/9780135425664/html/opening.html#DecomposingTheStatementFunction) ，將 `for` 迴圈內做的不同事情分開（計算 `volumeCredits` 和 `totalAmount`）
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const usd = (aNumber) => { /*...*/ }

  let result = `Statement for ${invoice.customer}\n`;

  let totalAmount = 0;
  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];

    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
    totalAmount += amountFor(perf);
  }

  let volumeCredits = 0;
  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];

    volumeCredits += volumeCreditsFor(perf);
  }
  result += `Amount owed is ${usd(totalAmount)}\n`;
  result += `You earned ${volumeCredits} credits\n`;
  return result;
```
上方用到一個小技巧 [Slide Statements](https://memberservices.informit.com/my_account/webedition/9780135425664/html/slidestatements.html) 用意是將同類型的變數擺在一起，例如上方的 `volumeCredits` 置於計算他的 `for` 迴圈之上。

接下來使用 [Extract Function](https://memberservices.informit.com/my_account/webedition/9780135425664/html/extractfunction.html) 將他們各自抽出
```javascript
const statement = (invoice, plays) => {

  const playFor = aPerformance => plays[aPerformance.playID];

  const amountFor = (perf, play) => { /*...*/ }

  const volumeCreditsFor = (aPerformance) => { /*...*/ }

  const usd = (aNumber) => { /*...*/ }

  const totalVolumeCredits = () => {
    let result = 0;
    for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
      const perf = invoice.performances[i];
      result += volumeCreditsFor(perf);
    }
    return result;
  }

  const getTotalAmount = () => {
    let result = 0;
    for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
      const perf = invoice.performances[i];
      result += amountFor(perf);
    }
    return result;
  }

  let result = `Statement for ${invoice.customer}\n`;

  for (let i = 0; i <= invoice.performances.length - 1; i += 1) {
    const perf = invoice.performances[i];
    result += `  ${playFor(perf).name}: ${usd(amountFor(perf))} (${perf.audience} seats)\n`;
  }

  result += `Amount owed is ${usd(totalAmount())}\n`;
  result += `You earned ${totalVolumeCredits()} credits\n`;
  return result;
```
一樣 combo [Inline Variable](https://memberservices.informit.com/my_account/webedition/9780135425664/html/inlinevariable.html) 處理 `totalAmount` 和 `volumeCredits`

> 這裡和上方的 `playFor` 相同，因為重構都重複執行了原本只需執行一次的部分，但在重構的階段性能是次級重要的，當程式重構完成，變得清晰有條理時便會很方便地再進行調整性能，但我們不能為了維持性能而讓程式呈現雜亂的樣子。

> 到此為止可以發現，重構是有邏輯性的，首先觀察 `for` 迴圈，使用 [Split Loop](https://memberservices.informit.com/my_account/webedition/9780135425664/html/opening.html#DecomposingTheStatementFunction) 取出功能不同的部分，再將以 [Slide Statements](https://memberservices.informit.com/my_account/webedition/9780135425664/html/slidestatements.html) 將同類型的變數放一起， 接著便能使用  [Extract Function](https://memberservices.informit.com/my_account/webedition/9780135425664/html/extractfunction.html) 將他們各自抽出 ，最後一步則是 [Inline Variable](https://memberservices.informit.com/my_account/webedition/9780135425664/html/inlinevariable.html) 處理 temp 的變數。 

經過上方，便能讓 `statement` 的執行結構清晰明瞭，也更能了解整體的執行功能。

## 總心得
1. 電腦不會在乎程式的好不好看，不論如何只要語法正確都可以執行，但當需求改變時，我們會接觸程式，也會在乎。
2. 承上點，醜陋的程式不容易理解也不容易修改，如果弄不懂要改哪裡就很容易出錯，因此重構最重要的是讓 Method 擁有結構。
3. 如果你的程式能夠正常運作，且永遠不需要再次修改，當然！就可以不用重構，但只要有一點可能性某人會需要了解它，將它重構會更好。
4. 重構需要測試，因為你不會曉得在哪一次的修改中讓 Method 產生錯誤，透過測試能夠更輕易的找到問題。