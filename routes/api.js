"use strict";
require("dotenv").config();
const fetch = require("node-fetch");
const mongoose = require("mongoose");
const helmet = require("helmet");
var { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Defining my stockSchema
const stockSchema = new Schema({
  stock: {
    type: String,
    required: true,
    unique: true,
  },
  IP: {
    type: "array",
    default: [],
  },
});

const Stock = mongoose.model("Stock", stockSchema);

// Drop all documents in the Stock collection if it exists
// async function emptyColl() {
//   await Stock.remove({});
//   return
// }

// emptyColl()

function stk(stock, price, like) {
  if (stock) {
    return { stock: stock, price: price };
  } else {
    return { rel_likes: like == "true" ? 1 : 0 };
  }
}

async function findStock(stock, price, like, ip) {
  let stck = await Stock.findOne({ stock: stock });

  if (!stck) {
    const newStock = new Stock({
      stock: stock,
      price: price,
      likes: like == "true" ? [ip] : [],
    });

    const result = await newStock.save();
    return result.IP.length;
  } else {
    if (like == "false" || stck.IP.includes(ip)) {
      return stck.IP.length;
    } else {
      stck.IP.push(ip);
      const result = await stck.save();
      return result.IP.length;
    }
  }
}

async function fetcher(url) {
  const response = await fetch(url);
  const { symbol: stock, latestPrice: price } = await response.json();
  return { stock, price };
}

module.exports = function (app) {
  const url = [
    "https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/",
    "/quote",
  ];

  app.route("/api/stock-prices").get(async function (req, res) {
    const ip = req.socket.remoteAddress;
    const likey = req.query.like;
    const stocks = req.query.stock;

    // Case of one stock
    if (typeof stocks == "string") {
      let stockData = { stock: null, price: null };

      // Fetching for the stock to the url
      const fetchurl = url[0] + stocks + url[1];
      const { stock, price } = await fetcher(fetchurl);

      if (stock == undefined) {
        res.json({ stockData: { likes: likey == "true" ? 1 : 0 } });
        return console.log("External ressource !");
      }

      stockData.price = price;
      stockData.stock = stock;

      // Querying in my DB for the number of likes
      Stock.findOne({ stock: stock }, async function (err, data) {
        if (err) {
          console.log(err);
          return;
        }
        if (data == null || data == undefined) {
          // Creating a new document in the Stock db
          Stock.create({
            stock: stock,
            IP: likey == "true" ? [ip] : [],
          });

          stockData.likes = likey == "true" ? 1 : 0;
          res.json({ stockData });
          return;
        }

        const IPs = data._doc.IP;

        if (IPs.includes(ip)) {
          // Check if the ip already exist in the db
          stockData.likes = IPs.length;
          res.json({ stockData });
          return;
        } else if (!IPs.includes(ip)) {
          // ip not in the db for this actual stock
          data._doc.IP.push(ip);

          data._doc.IP = data._doc.IP.filter((element, index) => {
            return data._doc.IP.indexOf(element) === index;
          });

          const result = await data.save();
          stockData.likes = result.IP.length;
          res.json({ stockData });
        }
      });
    }

    // Case of two stocks
    else {
      const [fetchurl1, fetchurl2] = [
        url[0] + stocks[0] + url[1],
        url[0] + stocks[1] + url[1],
      ];

      const { stock: stock1, price: price1 } = await fetcher(fetchurl1);
      const { stock: stock2, price: price2 } = await fetcher(fetchurl2);

      let stockData1 = stk(stock1, price1, likey);
      let stockData2 = stk(stock2, price2, likey);

      if (stock1) {
        const likes1 = await findStock(stock1, price1, likey, ip);
        stockData1.rel_likes = likes1;
      }
      if (stock2) {
        const likes2 = await findStock(stock2, price2, likey, ip);
        stockData2.rel_likes = likes2;
      }

      // Defining the rel_likes
      const rel = stockData1.rel_likes - stockData2.rel_likes;
      stockData1.rel_likes = rel >= 0 ? rel : -rel;
      stockData2.rel_likes = rel < 0 ? rel : -rel;

      res.json({
        stockData: [stockData1, stockData2],
      });

      return;
    }
  });
};
