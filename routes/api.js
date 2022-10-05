"use strict";
require("dotenv").config();
var mongoose = require("mongoose");
var { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 1- Defining my stockSchema
const stockSchema = new Schema({
  stock: {
    type: String,
    required: true,
  },
  IP: [String],
  // likes: {
  //   type: Number,
  //   default: 0,
  // },
});

const Stock = mongoose.model("Stock", stockSchema);

module.exports = function (app) {
  const url = [
    "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/",
    "/quote",
  ];

  app.route("/api/stock-prices").get(function (req, res) {
    const ip = req.socket.remoteAddress;

    if (params.length == 2) {
      const [stock, likey] = req.params;
      let stockData = 0;

      fetch(params[0])
        .then((response) => response.json())
        .then((data) => {
          stockData = {
            stock: data.symbol,
            price: data.close,
          };
        })
        .catch((err) => {
          res.json({
            stockData: { error: "External data ressource !", likes: 0 },
          });
        });

      const query = Stock.find({ stock: stock });

      query.then((err, data) => {
        if (err) {
          Stock.create({ stock, IP: [ip], likes: likey ? 1 : 0 });

          stockData.likes = likey ? 1 : 0;
          res.json({ stockData });
          return;
        }

        IPs = data.IP;

        if (IPs.some((d) => d == ip)) {
          stockData.likes = IPs.length;
          res.json({ stockData });
          return;
        } else {
          IPs.push(ip);
          data.save((err) => {
            if (err) {
              stockData.likes = IPs.length;
              res.send({ stockData });
              return console.log("Unable to like !");
            }

            stockData.likes = IPs.length + 1;
            res.json({ stockData });
            return console.log("Done !");
          });
        }
      });
    }

    // Case of two stocks
    else {
      const stocks = params.slice(2),
        like = params[-1];
      const fetchs = Promise.all(stocks);
      fetchs
        .then((response) => response.json())
        .then((dataArr) => {
          // const [stock1, stock2] = dataArr;
          const [stockData1, stockData2] = [
            { stock: dataArr[0].stock, price: dataArr[0].close},
            { stock: dataArr[1], price: dataArr[1].close},
          ];

          // First query
          const query1 = Stock.find({ stock: stocks[0] });
          let likes1;

          query1.then((err, data) => {
            if (err) {
              Stock.create({ stock: stocks[0], IP: [ip] });
              likes1 = like ? 1 : 0;
            } else {
              if (data.IP.some((d) => d == ip)) {
                likes1 = data.IP.length;
              } else {
                data.IP.push(ip);
                data.save();
                likes1 = data.IP.length + 1;
              }
            }
          });

          // Second query
          const query2 = Stock.find({ stock: stocks[1] });
          let likes2 = 0;

          query2.then((err, data) => {
            if (err) {
              Stock.create({ stock: stocks[1], IP: [ip] });
              likes2 = like ? 1 : 0;
            } else {
              if (data.IP.some((d) => d == ip)) {
                likes2 = data.IP.length;
              } else {
                data.IP.push(ip);
                data.save((err, data) => {
                  if(err) return console.log("Unable to save to the database !")
                  likes2 = data.IP.length + 1;
                });
              }
            }
          });

          // Defining the rel_likes
          rel = likes1 - likes2
          stockData1.rel_likes = rel >= 0 ? rel : -rel
          stockData2.rel_likes = rel < 0 ? rel : -rel

          res.json({
            stockData: [stockData1, stockData2]
          })
        });
    }
  });
};
