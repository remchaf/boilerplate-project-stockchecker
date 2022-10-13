const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

describe("Functional Tests", function () {
  it("#1 - Viewing one stack: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/?stock=goog&like=false")
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(
          res.body,
          "stockData",
          "stockData should be a property of the return object !"
        );
        assert.property(res.body.stockData, "stock");
        assert.property(res.body.stockData, "price");
        assert.property(res.body.stockData, "likes");
      });
    done();
  });

  it("#2 - Viewing one stock and liking it: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/?stock=msft&like=true")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.likes, 1);
      });
    done();
  });

  it("#3 - Viewing the same stock and liking it again: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/?stock=msft&like=true")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.likes, 1);
      });
    done();
  });

  it("#4 - Viewing two stocks: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/?stock=aap&stock=googl&like=false")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body.stockData, "array");
        assert.property(res.body.stockData[0], "rel_likes");
      });
    done();
  });

  it("#5 - Viewing two stocks and liking them: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/?stock=msft&stock=TSLA&like=true")
      .end(function (err, res) {
        console.log(res.body)
        assert.equal(res.body.stockData[0].rel_likes, 0);
        assert.equal(res.body.stockData[1].rel_likes, 0);
      });
    done();
  });
});
