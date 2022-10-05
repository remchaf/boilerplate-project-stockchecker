const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  test("#1 - Viewing one stack: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/stock=goog&like=false")
      .end((err, res) => {
        assert.status(200);
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

  test("#2 - Viewing one stock and liking it: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/stock=msft&like=true")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.likes, 1);
      });
    done();
  });

  test("#3 - Viewing the same stock and liking it again: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/stock=msft&like=true")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.like, 1);
      });
    done();
  });

  test("#4 - Viewing two stocks: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/stock=aap&stock=googl&like=false")
      .end(function (err, res) {
        assert.equal(res.status, 200);
        assert.typeOf(res.body.stockData, "array");
        assert.property(res.body[0], "rel_likes");
      });
    done();
  });

  test("#5 - Viewing two stocks and liking them: GET request to /api/stock-prices/", function (done) {
    chai
      .request(server)
      .get("/api/stock-prices/stock=goog&stock=msft&like=true")
      .end(function (err, res) {
        assert.equal(res.body.stockData[0].rel_likes, 1);
        assert.equal(res.body.stockData.rel_likes, -1);
      });
    done();
  });
});
