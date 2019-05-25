## 增加針對組織不同的計算條件
上一章的最後，為了增加 render HTML 的方式，將產生資料的邏輯部分取出來變成 `createStatementData` ，留下原本的 `renderText` 這麼一來就能簡單的新增另一個 `renderHTML` 的 `method` 。

現在，又增加了要依不同組織而擁有不同的計算條件，這個部分首要調整的不再是結構，而是調整計算邏輯的 `enrichPerformance` 部分。


第一步先利用 [Replace Conditional with Polymorphism](https://memberservices.informit.com/my_account/webedition/9780135425664/html/replaceconditionalwithpolymorphism.html) 的概念，為回傳多種型態的 `function` 建立 `constructor` 建構器，並傳入 `performances` 資料及 `play` ，讓 `construtor` 可以建構出擁有 `performances` 和 `play` 屬性的物件：
```javascript
const createStatementData = (invoice, plays) => {

  class PerformancesCalculator {
    constructor(aPerformances, aPlay) {
      this.performances = aPerformances;
      this.play = aPlay;
    }
  }

  const playFor = perf => plays[perf.playID];

  const amountFor = (perf) => { /*...*/ };

  const totalAmount = data => { /*...*/ };

  const volumeCreditsFor = (perf) => { /*...*/ };

  const totalVolumeCredits = data => { /*...*/ };

  const enrichPerformances = ((aPerformances) => {
    const calculator = new PerformancesCalculator(aPerformances, playFor(aPerformances));
    const data = { ...aPerformances, };
    data.play = calculator.play;
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
```
接下來將計算的 `amountFor` 放到 `PerformancesCalculator` 中：
```javascript
class PerformancesCalculator {
  constructor(aPerformances, aPlay) {
    this.performances = aPerformances;
    this.play = aPlay;
  }

  get amount() {
    let result = 0;
    switch (this.play.type) {
      case 'tragedy':
        result = 40000;
        if (this.performances.audience > 30) {
          result += 1000 * (this.performances.audience - 30);
        }
        break;
      case 'comedy':
        result = 30000;
        if (this.performances.audience > 20) {
          result += 10000 + 500 * (this.performances.audience - 20);
        }
        result += 300 * this.performances.audience;
        break;
      default:
        throw new Error(`unknown type: ${this.play.type}`);
    }
    return result;
  }
}
```
`amountFor` 內的描述也可以由從建構器產生出來的 Object 取得：
```javascript
const amountFor = (perf) => new PerformancesCalculator(perf, playFor(aPerformances)).amount;
```
確認沒問題後使用 [Inline Variable](https://memberservices.informit.com/my_account/webedition/9780135425664/html/inlinevariable.html) 修改 `enrichPerformances` ，然後把多餘的 `amountFor` 給刪掉：
```javascript
const enrichPerformances = ((aPerformances) => {
  const calculator = new PerformancesCalculator(aPerformances, playFor(aPerformances));
  const data = { ...aPerformances, };
  data.play = calculator.play;
  data.amount = calculator.amount;
  data.volumeCredits = volumeCreditsFor(data);
  return data;
});
```
接下來用同樣的方式處理計算 `volumeCredits` 的部分：
```javascript
const createStatementData = (invoice, plays) => {

  class PerformancesCalculator {
    constructor(aPerformances, aPlay) {
      this.performances = aPerformances;
      this.play = aPlay;
    }

    get amount() {
      let result = 0;
      switch (this.play.type) {
        case 'tragedy':
          result = 40000;
          if (this.performances.audience > 30) {
            result += 1000 * (this.performances.audience - 30);
          }
          break;
        case 'comedy':
          result = 30000;
          if (this.performances.audience > 20) {
            result += 10000 + 500 * (this.performances.audience - 20);
          }
          result += 300 * this.performances.audience;
          break;
        default:
          throw new Error(`unknown type: ${this.play.type}`);
      }
      return result;
    }

    get volumeCredits() {
      let result = 0;
      result += Math.max(this.performances.audience - 30, 0);
  
      if (this.play.type === 'comedy') {
        result += Math.floor(this.performances.audience / 5);
      }
      return result;
    }
  }

  const playFor = perf => plays[perf.playID];

  const totalAmount = data => { /*...*/ };

  const totalVolumeCredits = data => { /*...*/ };

  const enrichPerformances = ((aPerformances) => {
    const calculator = new PerformancesCalculator(aPerformances, playFor(aPerformances));
    const data = { ...aPerformances, };
    data.play = calculator.play;
    data.amount = calculator.amount;
    data.volumeCredits = calculator.volumeCredits;
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
```

